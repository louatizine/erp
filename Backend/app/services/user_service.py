from datetime import datetime

def calculate_leave_balance(user_id):
    users = get_user_collection()
    leaves = get_leave_collection()

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("created_at"):
        return None

    join_date = user["created_at"]
    now = datetime.utcnow()

    # Months worked
    months_worked = (now.year - join_date.year) * 12 + (now.month - join_date.month)

    # Entitled leave days (e.g., 2 days/month)
    entitled_leave_days = months_worked * 2

    # Total leave days taken (approved leaves)
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "status": "approved"}},
        {"$project": {
            "duration": {
                "$add": [
                    {"$divide": [{"$subtract": ["$end_date", "$start_date"]}, 86400000]},  # milliseconds in a day
                    1
                ]
            }
        }},
        {"$group": {"_id": None, "total_days": {"$sum": "$duration"}}}
    ]
    result = list(leaves.aggregate(pipeline))
    total_taken = result[0]["total_days"] if result else 0

    balance = entitled_leave_days - total_taken
    return max(balance, 0)
