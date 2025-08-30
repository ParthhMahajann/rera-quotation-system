from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt, uuid, re, json, os

# -------------------------------------------------------------------
# Initialize Flask app
# -------------------------------------------------------------------
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quotations.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

db = SQLAlchemy(app)
CORS(app, origins=['http://localhost:3000'])

# -------------------------------------------------------------------
# Load pricing data
# -------------------------------------------------------------------
def load_pricing_data():
    try:
        with open("pricing_data.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("⚠️ pricing_data.json not found, using default prices")
        return {}

PRICING_DATA = load_pricing_data()

# -------------------------------------------------------------------
# User Model
# -------------------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")  # user | admin

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# -------------------------------------------------------------------
# Quotation Model
# -------------------------------------------------------------------
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
    headers = db.Column(db.JSON)
    pricing_breakdown = db.Column(db.JSON)
    total_amount = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    discount_percent = db.Column(db.Float, default=0.0)
    service_summary = db.Column(db.Text)
    created_by = db.Column(db.String(200))
    status = db.Column(db.String(20), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Terms
    terms_accepted = db.Column(db.Boolean, default=False, nullable=False)
    applicable_terms = db.Column(db.JSON)

    # Approval
    requires_approval = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.String(100))
    approved_at = db.Column(db.DateTime)

    def to_dict(self):
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
            'discountPercent': self.discount_percent,
            'serviceSummary': self.service_summary,
            'createdBy': self.created_by,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'termsAccepted': bool(self.terms_accepted),
            'applicableTerms': self.applicable_terms or [],
            'requiresApproval': self.requires_approval,
            'approvedBy': self.approved_by,
            'approvedAt': self.approved_at.isoformat() if self.approved_at else None
        }

# -------------------------------------------------------------------
# Auth Helpers
# -------------------------------------------------------------------
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
        except Exception:
            return jsonify({"error": "Token invalid"}), 401
        return f(current_user, *args, **kwargs)
    return wraps(f)(decorator)

# -------------------------------------------------------------------
# Auth Routes
# -------------------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    if not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    user = User(username=data["username"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Signup successful"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get("username")).first()
    if not user or not user.check_password(data.get("password")):
        return jsonify({"error": "Invalid credentials"}), 401
    token = generate_token(user)
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return jsonify({"token": token, "role": user.role})

@app.route("/api/me", methods=["GET"])
@token_required
def get_profile(current_user):
    return jsonify({"id": current_user.id, "username": current_user.username, "role": current_user.role})

# -------------------------------------------------------------------
# Quotation CRUD
# -------------------------------------------------------------------
@app.route('/api/quotations', methods=['GET'])
def get_quotations():
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 10, type=int), 100)
    search = request.args.get('search', '').strip()
    query = Quotation.query
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Quotation.developer_name.ilike(search_pattern),
                Quotation.project_name.ilike(search_pattern),
                Quotation.id.ilike(search_pattern)
            )
        )
    query = query.order_by(Quotation.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    return jsonify({
        'success': True,
        'data': [q.to_dict() for q in pagination.items],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@app.route('/api/quotations', methods=['POST'])
def create_quotation():
    data = request.get_json()
    required = ['developerType', 'projectRegion', 'plotArea', 'developerName']
    for f in required:
        if not data.get(f):
            return jsonify({'error': f'Missing required field: {f}'}), 400
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

@app.route('/api/quotations/<quotation_id>', methods=['GET'])
def get_quotation(quotation_id):
    q = Quotation.query.filter_by(id=quotation_id).first()
    if not q:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': q.to_dict()})

@app.route('/api/quotations/<quotation_id>', methods=['PUT'])
def update_quotation(quotation_id):
    q = Quotation.query.filter_by(id=quotation_id).first()
    if not q:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    for field, db_field in [('headers', 'headers'), ('serviceSummary', 'service_summary'),
                            ('status', 'status'), ('termsAccepted', 'terms_accepted'),
                            ('applicableTerms', 'applicable_terms')]:
        if field in data:
            setattr(q, db_field, data[field])
    db.session.commit()
    return jsonify({'success': True, 'data': q.to_dict()})

# -------------------------------------------------------------------
# Calculate Pricing
# -------------------------------------------------------------------
@app.route('/api/quotations/calculate-pricing', methods=['POST'])
def calculate_pricing():
    try:
        data = request.get_json()
        category = data['developerType']
        region = data['projectRegion']
        plot_area = float(data['plotArea'])
        headers = data.get('headers', [])

        # plot area band
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
                s_name = service['label']
                try:
                    base = PRICING_DATA[category][region][band][s_name]['amount']
                except Exception:
                    base = 50000  # fallback
                subs = [
                    {"name": s.get('text', s.get('name', str(s))), "included": True}
                    for s in service.get('subServices', [])
                ]
                mult = 1.0 + (len(subs) * 0.1)
                total_amt = base * mult
                header_services.append({
                    "id": service["id"],
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
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------------
# Pricing Update & Approval
# -------------------------------------------------------------------
@app.route('/api/quotations/<quotation_id>/pricing', methods=['PUT'])
def update_pricing(quotation_id):
    q = Quotation.query.filter_by(id=quotation_id).first()
    if not q:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json()
    if 'pricingBreakdown' in data:
        q.pricing_breakdown = data['pricingBreakdown']
    if 'totalAmount' in data:
        q.total_amount = float(data['totalAmount'])
    if 'discountAmount' in data:
        q.discount_amount = float(data['discountAmount'])
    if 'discountPercent' in data:
        q.discount_percent = float(data['discountPercent'])
    if q.discount_percent > 20:
        q.requires_approval, q.status = True, "pending_approval"
    else:
        q.requires_approval = False
    db.session.commit()
    return jsonify({'success': True, 'data': q.to_dict()})

# -------------------------------------------------------------------
# Admin Approval
# -------------------------------------------------------------------
@app.route("/api/quotations/<quotation_id>/approve", methods=["PUT"])
@token_required
def approve(current_user, quotation_id):
    if current_user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    q = Quotation.query.filter_by(id=quotation_id).first()
    if not q:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    if data.get("action", "approve") == "approve":
        q.requires_approval, q.status = False, "approved"
        q.approved_by, q.approved_at = current_user.username, datetime.utcnow()
    else:
        q.status, q.requires_approval = "rejected", False
    db.session.commit()
    return jsonify({"success": True, "data": q.to_dict()})

@app.route("/api/quotations/pending", methods=["GET"])
@token_required
def pending(current_user):
    if current_user.role != "admin":
        return jsonify({"error": "Admin only"}), 403
    items = Quotation.query.filter_by(requires_approval=True).all()
    return jsonify({"success": True, "data": [q.to_dict() for q in items]})

# -------------------------------------------------------------------
# DB Init
# -------------------------------------------------------------------
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
