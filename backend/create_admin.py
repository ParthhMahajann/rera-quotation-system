from app import db, User, app

with app.app_context():
    username = "Admin"
    password = "1234"

    if User.query.filter_by(username=username).first():
        print("User already exists")
    else:
        admin = User(username=username, role="admin")
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"✅ Admin user {username} created.")
