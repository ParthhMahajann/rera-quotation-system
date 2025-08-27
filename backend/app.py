from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import json
import os
import uuid
import re

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quotations.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, origins=['http://localhost:3000'])

# Database Models
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
        }

# Load pricing data
def load_pricing_data():
    try:
        with open('pricing_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: pricing_data.json not found")
        return {}

PRICING_DATA = load_pricing_data()

# Helper functions
def generate_quotation_id():
    today = datetime.now().strftime('%Y%m%d')
    unique_suffix = str(uuid.uuid4())[:8].upper()
    return f"QUO-{today}-{unique_suffix}"

def get_plot_area_band(plot_area):
    if plot_area <= 500:
        return "0-500"
    elif plot_area <= 2000:
        return "500-2000"
    elif plot_area <= 4000:
        return "2000-4000"
    elif plot_area <= 6500:
        return "4000-6500"
    else:
        return "6500 and above"

def normalize_developer_type(dev_type):
    mapping = {
        'cat1': 'Category 1',
        'cat2': 'Category 2',
        'cat3': 'Category 3',
        'agent': 'Agent'
    }
    return mapping.get(dev_type.lower(), dev_type)

def validate_mobile(mobile):
    return bool(re.match(r'^[6-9]\d{9}$', str(mobile).strip())) if mobile else True

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email.strip())) if email else True

# API Routes
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}

@app.route('/api/quotations', methods=['GET'])
def get_quotations():
    try:
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
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotations', methods=['POST'])
def create_quotation():
    try:
        data = request.get_json()
        
        # Basic validation
        required_fields = ['developerType', 'projectRegion', 'plotArea', 'developerName']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if data['developerType'] == 'agent' and not validate_mobile(data.get('contactMobile')):
            return jsonify({'error': 'Valid mobile number required for agents'}), 400
        
        if data.get('contactEmail') and not validate_email(data['contactEmail']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Create quotation
        quotation = Quotation(
            id=generate_quotation_id(),
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
            created_by=data.get('createdBy', data['developerName'])
        )
        
        db.session.add(quotation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': quotation.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotations/<quotation_id>', methods=['GET'])
def get_quotation(quotation_id):
    try:
        quotation = Quotation.query.filter_by(id=quotation_id).first()
        if not quotation:
            return jsonify({'error': 'Quotation not found'}), 404
        
        return jsonify({
            'success': True,
            'data': quotation.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotations/<quotation_id>', methods=['PUT'])
def update_quotation(quotation_id):
    try:
        quotation = Quotation.query.filter_by(id=quotation_id).first()
        if not quotation:
            return jsonify({'error': 'Quotation not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        updateable_fields = [
            ('headers', 'headers'),
            ('serviceSummary', 'service_summary'),
            ('status', 'status')
        ]
        
        for json_field, db_field in updateable_fields:
            if json_field in data:
                setattr(quotation, db_field, data[json_field])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': quotation.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotations/<quotation_id>/pricing', methods=['PUT'])
def update_quotation_pricing(quotation_id):
    try:
        quotation = Quotation.query.filter_by(id=quotation_id).first()
        if not quotation:
            return jsonify({'error': 'Quotation not found'}), 404
        
        data = request.get_json()
        
        if 'pricingBreakdown' in data:
            quotation.pricing_breakdown = data['pricingBreakdown']
        if 'totalAmount' in data:
            quotation.total_amount = float(data['totalAmount'])
        if 'discountAmount' in data:
            quotation.discount_amount = float(data['discountAmount'])
        if 'discountPercent' in data:
            quotation.discount_percent = float(data['discountPercent'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': quotation.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/quotations/calculate-pricing', methods=['POST'])
def calculate_pricing():
    try:
        data = request.get_json()
        
        required_fields = ['developerType', 'projectRegion', 'plotArea']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        category = normalize_developer_type(data['developerType'])
        region = data['projectRegion']
        plot_area_band = get_plot_area_band(data['plotArea'])
        headers = data.get('headers', [])
        
        # Special handling for agents
        if category == 'Agent':
            total_services = sum(len(h.get('services', [])) for h in headers)
            agent_total = 25000 + (total_services * 5000)
            
            breakdown = []
            for header_data in headers:
                header_services = []
                for service in header_data.get('services', []):
                    # ✅ Include subServices array (even if empty)
                    formatted_sub_services = []
                    for sub_service in service.get('subServices', []):
                        formatted_sub_services.append({
                            'name': sub_service.get('text', sub_service.get('name', str(sub_service))),
                            'included': True
                        })
                    
                    header_services.append({
                        'id': service['id'],
                        'name': service['label'],
                        'baseAmount': 5000,
                        'totalAmount': 5000,
                        'subServices': formatted_sub_services  # ✅ Always include this
                    })
                
                breakdown.append({
                    'header': header_data['header'],
                    'services': header_services,
                    'headerTotal': len(header_services) * 5000
                })
            
            return jsonify({
                'success': True,
                'breakdown': breakdown,
                'summary': {
                    'subtotal': agent_total,
                    'totalServices': total_services
                }
            })
        
        # Regular pricing calculation
        breakdown = []
        total_amount = 0.0
        total_services = 0
        
        for header_data in headers:
            header_name = header_data['header']
            services = header_data.get('services', [])
            header_services = []
            header_total = 0.0
            
            for service_data in services:
                service_name = service_data['label']
                
                # Get pricing from JSON data
                try:
                    service_price = PRICING_DATA[category][region][plot_area_band][service_name]['amount']
                except KeyError:
                    service_price = 50000  # Default fallback
                
                # Simple sub-service multiplier
                sub_service_count = len(service_data.get('subServices', []))
                multiplier = 1.0 + (sub_service_count * 0.1)
                total_price = service_price * multiplier
                
                # ✅ Format subServices properly
                formatted_sub_services = []
                for sub_service in service_data.get('subServices', []):
                    formatted_sub_services.append({
                        'name': sub_service.get('text', sub_service.get('name', str(sub_service))),
                        'included': True
                    })
                
                header_services.append({
                    'id': service_data['id'],
                    'name': service_name,
                    'baseAmount': service_price,
                    'totalAmount': round(total_price, 2),
                    'subServices': formatted_sub_services  # ✅ Always include this
                })
                
                header_total += total_price
                total_services += 1
            
            breakdown.append({
                'header': header_name,
                'services': header_services,
                'headerTotal': round(header_total, 2)
            })
            
            total_amount += header_total
        
        return jsonify({
            'success': True,
            'breakdown': breakdown,
            'summary': {
                'subtotal': round(total_amount, 2),
                'totalServices': total_services
            }
        })
    
    except Exception as e:
        print(f"Pricing calculation error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# Initialize database
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3001)
