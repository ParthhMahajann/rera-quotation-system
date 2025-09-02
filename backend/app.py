from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm.attributes import flag_modified
import jwt, uuid, json, traceback, logging

# Import agent routes
from agent_routes import agent_bp

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quotations.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

# Enable debugging and logging
app.config['DEBUG'] = True
app.config['SQLALCHEMY_ECHO'] = False

# Set up logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

db = SQLAlchemy(app)
CORS(app, origins=['http://localhost:3000'])

# Register the agent blueprint
app.register_blueprint(agent_bp)

def load_pricing_data():
    try:
        with open("pricing_data.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

PRICING_DATA = load_pricing_data()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fname = db.Column(db.String(80), nullable=True)
    lname = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")
    threshold = db.Column(db.Float, default=0.0)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Quotation(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    developer_type = db.Column(db.String(20), nullable=False)
    project_region = db.Column(db.String(100), nullable=False)
    plot_area = db.Column(db.Float, nullable=False)
    developer_name = db.Column(db.String(200), nullable=False)
    project_name = db.Column(db.String(200))
    contact_mobile = db.Column(db.String(15))
    contact_email = db.Column(db.String(100))
    validity = db.Column(db.String(20), default='7 days')
    payment_schedule = db.Column(db.String(10), default='50%')
    rera_number = db.Column(db.String(50))
    
    # Use MutableList for JSON fields that store arrays
    headers = db.Column(MutableList.as_mutable(db.JSON))
    pricing_breakdown = db.Column(MutableList.as_mutable(db.JSON))
    applicable_terms = db.Column(MutableList.as_mutable(db.JSON))
    custom_terms = db.Column(MutableList.as_mutable(db.JSON))
    
    total_amount = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    discount_percent = db.Column(db.Float, default=0.0)
    service_summary = db.Column(db.Text)
    created_by = db.Column(db.String(200))
    status = db.Column(db.String(20), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    terms_accepted = db.Column(db.Boolean, default=False, nullable=False)
    requires_approval = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.String(100))
    approved_at = db.Column(db.DateTime)

    def to_dict(self):
        effective_discount = (
            self.discount_percent if self.discount_percent > 0
            else (self.discount_amount / (self.total_amount + self.discount_amount) * 100
                  if self.total_amount and self.discount_amount else 0)
        )

        return {
            'id': self.id,
            'developerType': self.developer_type,
            'projectRegion': self.project_region,
            'plotArea': self.plot_area,
            'developerName': self.developer_name,
            'projectName': self.project_name,
            'contactMobile': self.contact_mobile,
            'contactEmail': self.contact_email,
            'validity': self.validity,
            'paymentSchedule': self.payment_schedule,
            'reraNumber': self.rera_number,
            'headers': self.headers or [],
            'pricingBreakdown': self.pricing_breakdown or [],
            'totalAmount': self.total_amount,
            'discountAmount': self.discount_amount,
            'effectiveDiscountPercent': round(effective_discount, 2),
            'serviceSummary': self.service_summary,
            'createdBy': self.created_by,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'termsAccepted': bool(self.terms_accepted),
            'applicableTerms': self.applicable_terms or [],
            'customTerms': self.custom_terms or [],
            'requiresApproval': self.requires_approval,
            'approvedBy': self.approved_by,
            'approvedAt': self.approved_at.isoformat() if self.approved_at else None
        }

# Helper functions for approval logic
def requires_approval_due_to_packages(headers):
    """Check if any Package option is selected with sub-services"""
    if not headers:
        return False
    for header_data in headers:
        header_name = header_data.get('header', '') or header_data.get('name', '')
        if header_name and 'package' in header_name.lower():
            services = header_data.get('services', [])
            if services and len(services) > 0:
                return True
    return False

def requires_approval_due_to_customized_header(headers):
    """Check if Customized Header option is selected with sub-services"""
    if not headers:
        return False
    for header_data in headers:
        header_name = header_data.get('header', '') or header_data.get('name', '')
        if header_name and 'customized header' in header_name.lower():
            services = header_data.get('services', [])
            if services and len(services) > 0:
                return True
    return False

# Role-based access control decorator
def role_required(*roles):
    """Decorator to check if user has required role"""
    from functools import wraps
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if "Authorization" in request.headers:
                token = request.headers["Authorization"].split(" ")[1]
            if not token:
                return jsonify({"error": "Token missing"}), 401
            
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = User.query.get(data["user_id"])
                if not current_user or current_user.role not in roles:
                    return jsonify({"error": "Insufficient permissions"}), 403
            except Exception as e:
                return jsonify({"error": "Token invalid"}), 401
            
            return f(current_user, *args, **kwargs)
        return decorated
    return wrapper

# -------------------- AUTH HELPERS --------------------

def generate_token(user):
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")

def token_required(f):
    from functools import wraps
    def decorator(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except Exception as e:
            app.logger.error(f"Token validation error: {str(e)}")
            return jsonify({"error": "Token invalid"}), 401
        return f(current_user, *args, **kwargs)
    return wraps(f)(decorator)

# Global error handler
@app.errorhandler(500)
def internal_error(error):
    app.logger.error('Server Error: %s', error)
    app.logger.error('Traceback: %s', traceback.format_exc())
    db.session.rollback()
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

# -------------------- AUTH ROUTES --------------------

# Updated signup route with role-based restrictions
@app.route("/api/signup", methods=["POST"])
@role_required("admin", "manager")  # Only admin and manager can create users
def signup(current_user):  # current_user is passed by the decorator
    try:
        data = request.get_json()
        if not data.get("username") or not data.get("password"):
            return jsonify({"error": "Username and password required"}), 400

        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "Username already exists"}), 400

        new_role = data.get("role", "user")
        new_threshold = float(data.get("threshold", 0))

        # Role-based restrictions for managers
        if current_user.role == "manager":
            # Managers can only create 'user' role, not 'admin' or 'manager'
            if new_role in ["admin", "manager"]:
                return jsonify({"error": "Managers cannot create admin or manager users"}), 403
            
            # Managers can only assign threshold up to their own limit
            if new_threshold > current_user.threshold:
                return jsonify({"error": f"Threshold cannot exceed your limit of {current_user.threshold}%"}), 403
        
        # Admin can create any role with any threshold (no restrictions)

        user = User(
            fname=data.get("fname"),
            lname=data.get("lname"),
            username=data["username"],
            role=new_role,
            threshold=new_threshold  # Now properly assigned
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": {
                "username": user.username,
                "role": user.role,
                "threshold": user.threshold
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "User creation failed"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(username=data.get("username")).first()
        if not user or not user.check_password(data.get("password")):
            return jsonify({"error": "Invalid credentials"}), 401

        token = generate_token(user)
        if isinstance(token, bytes):
            token = token.decode("utf-8")

        return jsonify({
            "token": token,
            "role": user.role,
            "fname": user.fname,
            "lname": user.lname,
            "username": user.username,
            "threshold": user.threshold
        })
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@app.route("/api/me", methods=["GET"])
@token_required
def get_profile(current_user):
    return jsonify({
        "id": current_user.id,
        "fname": current_user.fname,
        "lname": current_user.lname,
        "username": current_user.username,
        "role": current_user.role,
        "threshold": current_user.threshold
    })

# -------------------- QUOTATIONS --------------------

@app.route('/api/quotations', methods=['GET'])
def get_quotations():
    try:
        query = Quotation.query.order_by(Quotation.created_at.desc())
        return jsonify({
            'success': True,
            'data': [q.to_dict() for q in query.all()]
        })
    except Exception as e:
        app.logger.error(f"Get quotations error: {str(e)}")
        return jsonify({'error': 'Failed to fetch quotations'}), 500

@app.route('/api/quotations', methods=['POST'])
def create_quotation():
    try:
        data = request.get_json()
        quotation = Quotation(
            id=f"QUO-{uuid.uuid4().hex[:8].upper()}",
            developer_type=data['developerType'],
            project_region=data['projectRegion'],
            plot_area=float(data['plotArea']),
            developer_name=data['developerName'],
            project_name=data.get('projectName'),
            contact_mobile=data.get('contactMobile'),
            contact_email=data.get('contactEmail'),
            validity=data.get('validity', '7 days'),
            payment_schedule=data.get('paymentSchedule', '50%'),
            rera_number=data.get('reraNumber'),
            service_summary=data.get('serviceSummary'),
            created_by=data.get('createdBy', data['developerName']),
            terms_accepted=bool(data.get('termsAccepted', False)),
            applicable_terms=data.get('applicableTerms', [])
        )

        db.session.add(quotation)
        db.session.commit()

        return jsonify({'success': True, 'data': quotation.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Create quotation error: {str(e)}")
        return jsonify({'error': 'Failed to create quotation'}), 500

@app.route('/api/quotations/<quotation_id>', methods=['PUT'])
@token_required
def update_quotation(current_user, quotation_id):
    try:
        app.logger.debug(f"Updating quotation {quotation_id}")
        q = Quotation.query.filter_by(id=quotation_id).first()
        if not q:
            app.logger.error(f"Quotation {quotation_id} not found")
            return jsonify({'error': 'Not found'}), 404

        data = request.get_json()
        app.logger.debug(f"Update data: {data}")

        # Handle JSON field updates with proper type checking and modification flagging
        if 'headers' in data:
            app.logger.debug("Updating headers field")
            headers_data = data['headers']
            if isinstance(headers_data, list):
                q.headers = headers_data
                flag_modified(q, 'headers')
                app.logger.debug(f"Headers updated: {len(headers_data)} items")
            else:
                app.logger.warning(f"Headers data is not a list: {type(headers_data)}")
                q.headers = []
                flag_modified(q, 'headers')

        if 'serviceSummary' in data:
            q.service_summary = data['serviceSummary']
            app.logger.debug("Updated service summary")

        if 'status' in data:
            q.status = data['status']
            app.logger.debug(f"Updated status to: {data['status']}")

        if 'termsAccepted' in data:
            q.terms_accepted = data['termsAccepted']
            app.logger.debug(f"Updated terms accepted: {data['termsAccepted']}")

        if 'applicableTerms' in data:
            terms_data = data['applicableTerms']
            if isinstance(terms_data, list):
                q.applicable_terms = terms_data
                flag_modified(q, 'applicable_terms')
                app.logger.debug(f"Updated applicable terms: {len(terms_data)} items")
            else:
                q.applicable_terms = []
                flag_modified(q, 'applicable_terms')

        # Check approval requirements
        has_package_approval = requires_approval_due_to_packages(q.headers or [])
        has_customized_header_approval = requires_approval_due_to_customized_header(q.headers or [])

        # Calculate effective discount
        effective_discount = (
            q.discount_percent if q.discount_percent > 0
            else (q.discount_amount / (q.total_amount + q.discount_amount) * 100
                  if q.total_amount and q.discount_amount else 0)
        )

        # Combined approval logic
        if (has_package_approval or
            has_customized_header_approval or
            effective_discount > current_user.threshold or
            (q.custom_terms and len(q.custom_terms) > 0)):
            q.requires_approval = True
            q.status = 'pending_approval'
            app.logger.debug("Quotation requires approval")
        else:
            q.requires_approval = False
            q.status = 'draft'
            app.logger.debug("Quotation set to draft status")

        app.logger.debug("Committing changes to database")
        db.session.commit()
        app.logger.debug("Database commit successful")

        return jsonify({'success': True, 'data': q.to_dict()})

    except Exception as e:
        app.logger.error(f"Error updating quotation {quotation_id}: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': f'Failed to update quotation: {str(e)}'}), 500

@app.route('/api/quotations/<quotation_id>', methods=['GET'])
def get_quotation(quotation_id):
    try:
        q = Quotation.query.filter_by(id=quotation_id).first()
        if not q:
            return jsonify({'error': 'Not found'}), 404

        return jsonify({'success': True, 'data': q.to_dict()})
    except Exception as e:
        app.logger.error(f"Get quotation error: {str(e)}")
        return jsonify({'error': 'Failed to fetch quotation'}), 500

@app.route('/api/quotations/calculate-pricing', methods=['POST'])
def calculate_pricing():
    try:
        data = request.get_json()
        category = data['developerType']
        region = data['projectRegion']
        plot_area = float(data['plotArea'])
        headers = data.get('headers', [])

        if plot_area <= 500:
            band = "0-500"
        elif plot_area <= 2000:
            band = "500-2000"
        elif plot_area <= 4000:
            band = "2000-4000"
        elif plot_area <= 6500:
            band = "4000-6500"
        else:
            band = "6500+"

        breakdown, total, total_services = [], 0.0, 0

        for header_data in headers:
            header_services, header_total = [], 0.0
            for service in header_data.get('services', []):
                s_name = service.get('label', service.get('name'))
                try:
                    base = PRICING_DATA[category][region][band][s_name]['amount']
                except Exception:
                    base = 50000

                subs = [
                    {"name": s.get('text', s.get('name', str(s))), "included": True}
                    for s in service.get('subServices', [])
                ]

                multiplier = 1.0 + (len(subs) * 0.1)
                total_amt = base * multiplier

                header_services.append({
                    "id": service.get("id"),
                    "name": s_name,
                    "baseAmount": base,
                    "totalAmount": round(total_amt, 2),
                    "subServices": subs
                })

                header_total += total_amt
                total_services += 1

            breakdown.append({
                "header": header_data["header"],
                "services": header_services,
                "headerTotal": round(header_total, 2)
            })

            total += header_total

        return jsonify({
            "success": True,
            "breakdown": breakdown,
            "summary": {"subtotal": round(total, 2), "totalServices": total_services}
        })

    except Exception as e:
        app.logger.error(f"Error calculating pricing: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/quotations/<quotation_id>/pricing', methods=['PUT'])
@token_required
def update_pricing(current_user, quotation_id):
    try:
        q = Quotation.query.filter_by(id=quotation_id).first()
        if not q:
            return jsonify({'error': 'Not found'}), 404

        data = request.get_json()

        if 'pricingBreakdown' in data:
            q.pricing_breakdown = data['pricingBreakdown'] if isinstance(data['pricingBreakdown'], list) else []
            flag_modified(q, 'pricing_breakdown')

        if 'totalAmount' in data:
            q.total_amount = float(data['totalAmount'])

        if 'discountAmount' in data:
            q.discount_amount = float(data['discountAmount'])

        if 'discountPercent' in data:
            q.discount_percent = float(data['discountPercent'])

        # Calculate effective discount
        if q.discount_percent > 0:
            effective_discount = q.discount_percent
        elif q.total_amount and q.discount_amount:
            effective_discount = (q.discount_amount / (q.total_amount + q.discount_amount)) * 100
        else:
            effective_discount = 0

        # Check approval requirements including packages and customized headers
        has_package_approval = requires_approval_due_to_packages(q.headers or [])
        has_customized_header_approval = requires_approval_due_to_customized_header(q.headers or [])

        # Combined approval logic
        if (has_package_approval or
            has_customized_header_approval or
            effective_discount > current_user.threshold or
            (q.custom_terms and len(q.custom_terms) > 0)):
            q.requires_approval = True
            q.status = "pending_approval"
        else:
            q.requires_approval = False
            q.status = "completed"
            q.approved_by = current_user.username
            q.approved_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'success': True, 'data': q.to_dict()})

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating pricing: {str(e)}")
        return jsonify({'error': f'Failed to update pricing: {str(e)}'}), 500

@app.route('/api/quotations/<quotation_id>/terms', methods=['PUT'])
@token_required
def update_terms(current_user, quotation_id):
    try:
        q = Quotation.query.filter_by(id=quotation_id).first()
        if not q:
            return jsonify({'error': 'Quotation not found'}), 404

        data = request.get_json()
        terms_accepted = data.get('termsAccepted', False)
        applicable_terms = data.get('applicableTerms', [])
        custom_terms = data.get('customTerms', [])

        # Filter out empty custom terms
        valid_custom_terms = [term.strip() for term in custom_terms if term.strip()]

        # Update terms data
        q.terms_accepted = terms_accepted
        q.applicable_terms = applicable_terms if isinstance(applicable_terms, list) else []
        q.custom_terms = valid_custom_terms

        # Mark JSON fields as modified
        flag_modified(q, 'applicable_terms')
        flag_modified(q, 'custom_terms')

        # Calculate effective discount
        effective_discount = (
            q.discount_percent if q.discount_percent > 0
            else (q.discount_amount / (q.total_amount + q.discount_amount) * 100
                  if q.total_amount and q.discount_amount else 0)
        )

        # Check approval requirements
        has_package_approval = requires_approval_due_to_packages(q.headers or [])
        has_customized_header_approval = requires_approval_due_to_customized_header(q.headers or [])

        # Combined approval logic
        if (has_package_approval or
            has_customized_header_approval or
            valid_custom_terms or
            effective_discount > current_user.threshold):
            if q.status not in ['approved', 'completed']:
                q.requires_approval = True
                q.status = 'pending_approval'
        else:
            q.requires_approval = False
            q.status = 'completed'
            q.approved_by = current_user.username
            q.approved_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'success': True, 'data': q.to_dict()})

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating terms: {str(e)}")
        return jsonify({'error': f'Failed to update terms: {str(e)}'}), 500

@app.route("/api/quotations/<quotation_id>/approve", methods=["PUT"])
@token_required
def approve(current_user, quotation_id):
    try:
        if current_user.role not in ["admin", "manager"]:
            return jsonify({"error": "Only admin/manager can approve"}), 403

        q = Quotation.query.filter_by(id=quotation_id).first()
        if not q:
            return jsonify({"error": "Not found"}), 404

        # Calculate effective discount
        effective_discount = q.discount_percent if q.discount_percent > 0 else (
            (q.discount_amount / (q.total_amount + q.discount_amount)) * 100
            if q.total_amount and q.discount_amount else 0
        )

        # Manager cannot approve beyond their threshold
        if current_user.role == "manager" and effective_discount > current_user.threshold:
            return jsonify({"error": f"Approval requires admin (limit {current_user.threshold}%)"}), 403

        data = request.get_json() or {}

        if data.get("action", "approve") == "approve":
            q.requires_approval = False
            q.status = "completed"
            q.approved_by = current_user.username
            q.approved_at = datetime.utcnow()
        else:
            q.status = "rejected"
            q.requires_approval = False

        db.session.commit()
        return jsonify({"success": True, "data": q.to_dict()})

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error approving quotation: {str(e)}")
        return jsonify({"error": f"Failed to approve quotation: {str(e)}"}), 500

@app.route("/api/quotations/pending", methods=["GET"])
@token_required
def pending(current_user):
    try:
        if current_user.role not in ["admin", "manager"]:
            return jsonify({"error": "Only admin/manager can view pending"}), 403

        items = Quotation.query.filter_by(requires_approval=True).all()
        return jsonify({"success": True, "data": [q.to_dict() for q in items]})

    except Exception as e:
        app.logger.error(f"Error fetching pending quotations: {str(e)}")
        return jsonify({"error": "Failed to fetch pending quotations"}), 500

# -------------------- INIT --------------------

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
