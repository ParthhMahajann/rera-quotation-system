from app import db, User, app

with app.app_context():
    username = "admin"   # login userid
    password = "1234"
    fname = "System"
    lname = "Administrator"

    existing = User.query.filter_by(username=username).first()
    if existing:
        print("⚠️ User already exists")
    else:
        admin = User(
            fname=fname,
            lname=lname,
            username=username,
            role="admin",
            threshold=100  # admins can approve everything
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"✅ Admin user '{username}' created.")
