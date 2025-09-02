from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm.attributes import flag_modified
import jwt
import uuid
from datetime import datetime

agent_bp = Blueprint('agent_bp', __name__)

def get_current_user():
    """Helper function to validate token and get current user"""
    try:
        # Get token from Authorization header
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return None, jsonify({'error': 'Token missing'}), 401
        
        # Decode token
        try:
            data_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return None, jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return None, jsonify({'error': 'Token invalid'}), 401
        
        # Get database and models from app context
        from app import db, User
        
        # ✅ Use db.session.get() instead of User.query.get()
        user = db.session.get(User, data_token['user_id'])
        if not user:
            return None, jsonify({'error': 'User not found'}), 401
            
        return user, None, None
        
    except Exception as e:
        return None, jsonify({'error': f'Authentication failed: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations', methods=['POST'])
def create_agent_registration():
    """Create a new agent registration quotation"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import db, Quotation
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['agentName', 'mobile', 'agentType']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({'error': f'Missing or empty {field} field'}), 400
        
        # Validate mobile number format
        mobile = str(data['mobile']).strip()
        if not mobile.isdigit() or len(mobile) != 10:
            return jsonify({'error': 'Mobile number must be 10 digits'}), 400
        
        # Validate email if provided
        email = data.get('email', '').strip()
        if email and '@' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Create unique agent quotation ID
        agent_id = f"AGENT-{uuid.uuid4().hex[:8].upper()}"
        
        # Create quotation record for agent registration
        quotation = Quotation(
            id=agent_id,
            developer_type='agent',
            project_region=data.get('projectRegion', 'Maharashtra'),
            plot_area=0.0,  # Not applicable for agents
            developer_name=data['agentName'],
            project_name=f"Agent Registration - {data['agentType']}",
            contact_mobile=mobile,
            contact_email=email or None,
            validity='30 days',
            payment_schedule='100%',
            rera_number=None,
            service_summary=f"Agent Registration - {data['agentType']} - {data['agentName']}",
            created_by=data['agentName'],
            headers=[],
            pricing_breakdown=[],
            applicable_terms=[],
            custom_terms=[],
            total_amount=0.0,
            discount_amount=0.0,
            discount_percent=0.0,
            status='draft',
            created_at=datetime.utcnow(),
            terms_accepted=False,
            requires_approval=False,
            approved_by=None,
            approved_at=None
        )
        
        db.session.add(quotation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'quotationId': quotation.id,
            'message': 'Agent registration quotation created successfully',
            'data': quotation.to_dict()
        }), 201
        
    except Exception as e:
        from app import db
        db.session.rollback()
        current_app.logger.error(f"Error creating agent registration: {str(e)}")
        return jsonify({'error': f'Failed to create agent registration: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations/<quotation_id>/services', methods=['PUT'])
def update_agent_services(quotation_id):
    """Update services for agent registration"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import db, Quotation
        
        # ✅ Use db.session.get() instead of Quotation.query.filter_by().first()
        quotation = db.session.get(Quotation, quotation_id)
        if not quotation or quotation.developer_type != 'agent':
            return jsonify({'error': 'Agent quotation not found'}), 404
        
        data = request.get_json()
        services = data.get('services', [])
        
        if not services:
            return jsonify({'error': 'No services provided'}), 400
        
        # Format services for agent registration
        agent_services_header = {
            'header': 'Agent Registration Services',
            'services': []
        }
        
        total_amount = 0
        for service in services:
            service_data = {
                'id': service.get('id', service['name']),
                'label': service['name'],
                'baseAmount': service['price'],
                'totalAmount': service['price'],
                'subServices': []
            }
            agent_services_header['services'].append(service_data)
            total_amount += service['price']
        
        # Update quotation with services
        quotation.headers = [agent_services_header]
        quotation.total_amount = total_amount
        flag_modified(quotation, 'headers')
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Services updated successfully',
            'data': quotation.to_dict()
        })
        
    except Exception as e:
        from app import db
        db.session.rollback()
        current_app.logger.error(f"Error updating agent services: {str(e)}")
        return jsonify({'error': f'Failed to update services: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations/<quotation_id>/complete', methods=['PUT'])
def complete_agent_registration(quotation_id):
    """Complete agent registration quotation"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import db, Quotation
        
        # ✅ Use db.session.get() instead of Quotation.query.filter_by().first()
        quotation = db.session.get(Quotation, quotation_id)
        if not quotation or quotation.developer_type != 'agent':
            return jsonify({'error': 'Agent quotation not found'}), 404
        
        data = request.get_json()
        
        # Update final details
        quotation.terms_accepted = data.get('termsAccepted', False)
        quotation.status = 'completed'
        quotation.approved_by = current_user.username
        quotation.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent registration completed successfully',
            'data': quotation.to_dict()
        })
        
    except Exception as e:
        from app import db
        db.session.rollback()
        current_app.logger.error(f"Error completing agent registration: {str(e)}")
        return jsonify({'error': f'Failed to complete registration: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations', methods=['GET'])
def get_agent_registrations():
    """Get all agent registrations"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import Quotation
        
        # Only admin/manager can see all, users see their own
        if current_user.role in ['admin', 'manager']:
            quotations = Quotation.query.filter_by(developer_type='agent').order_by(Quotation.created_at.desc()).all()
        else:
            quotations = Quotation.query.filter_by(
                developer_type='agent',
                created_by=current_user.username
            ).order_by(Quotation.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [q.to_dict() for q in quotations]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching agent registrations: {str(e)}")
        return jsonify({'error': f'Failed to fetch agent registrations: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations/<quotation_id>', methods=['GET'])
def get_agent_registration(quotation_id):
    """Get specific agent registration"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import db, Quotation
        
        # ✅ Use db.session.get() instead of Quotation.query.filter_by().first()
        quotation = db.session.get(Quotation, quotation_id)
        if not quotation or quotation.developer_type != 'agent':
            return jsonify({'error': 'Agent quotation not found'}), 404
        
        # Check access permissions
        if current_user.role not in ['admin', 'manager'] and quotation.created_by != current_user.username:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'data': quotation.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching agent registration: {str(e)}")
        return jsonify({'error': f'Failed to fetch agent registration: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations/<quotation_id>', methods=['DELETE'])
def delete_agent_registration(quotation_id):
    """Delete agent registration (admin/manager only)"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Check admin/manager permissions
        if current_user.role not in ['admin', 'manager']:
            return jsonify({'error': 'Only admin/manager can delete registrations'}), 403
            
        # Get database and models
        from app import db, Quotation
        
        # ✅ Use db.session.get() instead of Quotation.query.filter_by().first()
        quotation = db.session.get(Quotation, quotation_id)
        if not quotation or quotation.developer_type != 'agent':
            return jsonify({'error': 'Agent quotation not found'}), 404
        
        db.session.delete(quotation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent registration deleted successfully'
        })
        
    except Exception as e:
        from app import db
        db.session.rollback()
        current_app.logger.error(f"Error deleting agent registration: {str(e)}")
        return jsonify({'error': f'Failed to delete agent registration: {str(e)}'}), 500

@agent_bp.route('/api/agent-registrations/<quotation_id>/pricing', methods=['PUT'])
def update_agent_pricing(quotation_id):
    """Update pricing for agent registration"""
    try:
        # Validate authentication
        current_user, error_response, error_code = get_current_user()
        if error_response:
            return error_response, error_code
            
        # Get database and models
        from app import db, Quotation
        
        # ✅ Use db.session.get() instead of Quotation.query.filter_by().first()
        quotation = db.session.get(Quotation, quotation_id)
        if not quotation or quotation.developer_type != 'agent':
            return jsonify({'error': 'Agent quotation not found'}), 404
        
        data = request.get_json()
        
        # Update pricing fields
        if 'totalAmount' in data:
            quotation.total_amount = float(data['totalAmount'])
            
        if 'discountAmount' in data:
            quotation.discount_amount = float(data['discountAmount'])
            
        if 'discountPercent' in data:
            quotation.discount_percent = float(data['discountPercent'])
            
        if 'pricingBreakdown' in data:
            quotation.pricing_breakdown = data['pricingBreakdown'] if isinstance(data['pricingBreakdown'], list) else []
            flag_modified(quotation, 'pricing_breakdown')
        
        # Update status
        quotation.status = 'completed'
        quotation.approved_by = current_user.username
        quotation.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Pricing updated successfully',
            'data': quotation.to_dict()
        })
        
    except Exception as e:
        from app import db
        db.session.rollback()
        current_app.logger.error(f"Error updating agent pricing: {str(e)}")
        return jsonify({'error': f'Failed to update pricing: {str(e)}'}), 500
