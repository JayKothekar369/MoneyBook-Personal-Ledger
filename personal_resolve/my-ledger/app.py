import json
from copy import deepcopy
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

import streamlit as st


APP_DIR = Path(__file__).parent
DATA_FILE = APP_DIR / "moneybook_data.json"
ACCOUNT_TYPES = ["Primary", "Savings", "Salary", "Credit"]
TRANSACTION_TYPES = {
    "expenditure": "Spent / Expenditure",
    "investment": "Investment",
    "saving": "Saving",
    "lent": "To Receive (Lent)",
    "borrowed": "To Pay (Borrowed)",
    "salary": "Salary",
}


st.set_page_config(
    page_title="MoneyBook",
    page_icon=str(APP_DIR / "public" / "favicon.svg"),
    layout="wide",
    initial_sidebar_state="expanded",
)


def load_data():
    if not DATA_FILE.exists():
        return {"users": []}
    try:
        with DATA_FILE.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict) or "users" not in data:
            return {"users": []}
        return data
    except (json.JSONDecodeError, OSError):
        return {"users": []}


def save_data(data):
    with DATA_FILE.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


def money(value):
    return f"Rs. {float(value or 0):,.2f}"


def parse_display_date(value):
    if not value:
        return date.today()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            pass
    return date.today()


def format_display_date(value):
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    return parse_display_date(value).strftime("%d/%m/%Y")


def current_user_index():
    user_id = st.session_state.get("active_user_id")
    users = st.session_state.data.get("users", [])
    for index, user in enumerate(users):
        if user.get("id") == user_id:
            return index
    return None


def current_user():
    index = current_user_index()
    if index is None:
        return None
    return st.session_state.data["users"][index]


def update_current_user(user):
    index = current_user_index()
    if index is not None:
        st.session_state.data["users"][index] = user
        if not user.get("isGuest"):
            save_data(st.session_state.data)


def calc_total(transactions, predicate):
    return sum(float(tx.get("amount") or 0) for tx in transactions if predicate(tx))


def month_key(tx):
    parsed = parse_display_date(tx.get("date"))
    return parsed.strftime("%Y-%m")


def add_balance(user, account_name, delta):
    for account in user.get("accounts", []):
        if account.get("name") == account_name:
            account["balance"] = float(account.get("balance") or 0) + delta
            return


def ensure_state():
    if "data" not in st.session_state:
        st.session_state.data = load_data()
    if "active_user_id" not in st.session_state:
        st.session_state.active_user_id = None


def render_auth():
    st.title("MoneyBook")
    st.caption("Personal finance, lending, borrowing, savings, and account tracking.")

    tab_login, tab_register, tab_guest = st.tabs(["Login", "Create profile", "Guest"])

    with tab_login:
        with st.form("login_form"):
            name = st.text_input("Name")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Login", use_container_width=True)
        if submitted:
            user = next(
                (
                    u
                    for u in st.session_state.data.get("users", [])
                    if u.get("name", "").strip().lower() == name.strip().lower()
                ),
                None,
            )
            if user and user.get("password") == password:
                st.session_state.active_user_id = user.get("id")
                st.rerun()
            st.error("Invalid name or password.")

    with tab_register:
        with st.form("register_form"):
            name = st.text_input("Profile name")
            mobile = st.text_input("Mobile number")
            password = st.text_input("Choose password", type="password")
            submitted = st.form_submit_button("Create profile", use_container_width=True)
        if submitted:
            trimmed_name = name.strip()
            users = st.session_state.data.setdefault("users", [])
            already_exists = any(
                u.get("name", "").strip().lower() == trimmed_name.lower() for u in users
            )
            if not trimmed_name or not password:
                st.error("Name and password are required.")
            elif already_exists:
                st.error("A profile with this name already exists.")
            else:
                user = {
                    "id": f"user_{uuid4().hex[:12]}",
                    "name": trimmed_name,
                    "mobile": mobile.strip(),
                    "password": password,
                    "accounts": [],
                    "transactions": [],
                    "deletedTransactions": [],
                }
                users.append(user)
                save_data(st.session_state.data)
                st.session_state.active_user_id = user["id"]
                st.success("Profile created.")
                st.rerun()

    with tab_guest:
        st.info("Guest data is kept only for this browser session.")
        if st.button("Continue as guest", use_container_width=True):
            user = {
                "id": f"guest_{uuid4().hex[:12]}",
                "name": "Guest Profile",
                "isGuest": True,
                "accounts": [],
                "transactions": [],
                "deletedTransactions": [],
            }
            st.session_state.data.setdefault("users", []).append(user)
            st.session_state.active_user_id = user["id"]
            st.rerun()


def render_sidebar(user):
    st.sidebar.title("MoneyBook")
    st.sidebar.caption(user.get("name", "Profile"))
    page = st.sidebar.radio(
        "Navigation",
        ["Dashboard", "Transactions", "Accounts", "Assistant", "Settings"],
    )
    if st.sidebar.button("Logout", use_container_width=True):
        st.session_state.active_user_id = None
        st.rerun()
    return page


def render_dashboard(user):
    transactions = user.get("transactions", [])
    accounts = user.get("accounts", [])
    selected_month = st.selectbox(
        "Month",
        sorted({month_key(tx) for tx in transactions}, reverse=True) or [date.today().strftime("%Y-%m")],
    )
    monthly = [tx for tx in transactions if month_key(tx) == selected_month]

    total_salary = calc_total(transactions, lambda tx: tx.get("type") == "salary")
    month_salary = calc_total(monthly, lambda tx: tx.get("type") == "salary")
    total_spent = calc_total(transactions, lambda tx: tx.get("type") == "expenditure")
    month_spent = calc_total(monthly, lambda tx: tx.get("type") == "expenditure")
    total_saved = calc_total(
        transactions, lambda tx: tx.get("type") in {"saving", "investment"}
    )
    month_saved = calc_total(monthly, lambda tx: tx.get("type") in {"saving", "investment"})

    cols = st.columns(4)
    cols[0].metric("To receive", money(calc_total(transactions, lambda tx: tx.get("type") == "lent" and tx.get("status") == "pending")))
    cols[1].metric("To pay", money(calc_total(transactions, lambda tx: tx.get("type") == "borrowed" and tx.get("status") == "pending")))
    cols[2].metric("Spent this month", money(month_spent), money(total_spent))
    cols[3].metric("Saved/invested this month", money(month_saved), money(total_saved))

    st.subheader("Salary overview")
    salary_cols = st.columns(2)
    salary_cols[0].metric("All-time salary", money(total_salary))
    salary_cols[1].metric("Selected month salary", money(month_salary))

    st.subheader("Account balances")
    if accounts:
        account_cols = st.columns(min(4, len(accounts)))
        for index, account in enumerate(accounts):
            with account_cols[index % len(account_cols)]:
                st.metric(
                    f"{account.get('name', 'Account')} ({account.get('type', 'Primary')})",
                    money(account.get("balance", 0)),
                )
    else:
        st.info("No accounts configured yet.")

    st.subheader("Recent transactions")
    render_transaction_table(user, transactions[:5], compact=True)


def render_transaction_form(user):
    accounts = user.setdefault("accounts", [])
    account_names = [account.get("name") for account in accounts]
    with st.form("transaction_form", clear_on_submit=True):
        cols = st.columns(2)
        name = cols[0].text_input("Title")
        reason = cols[1].text_input("Reason")
        amount = cols[0].number_input("Amount", min_value=0.0, step=10.0)
        tx_type = cols[1].selectbox("Type", list(TRANSACTION_TYPES), format_func=TRANSACTION_TYPES.get)
        tx_date = cols[0].date_input("Date", value=date.today())
        bank_name = cols[1].selectbox("Account", account_names) if account_names else ""
        submitted = st.form_submit_button("Add entry", use_container_width=True)

    if submitted:
        if not name.strip() or amount <= 0 or not bank_name:
            st.error("Title, amount, and account are required.")
            return
        is_auto_settle = tx_type in {"salary", "saving"}
        tx = {
            "id": int(datetime.now().timestamp() * 1000),
            "name": name.strip(),
            "reason": reason.strip(),
            "amount": float(amount),
            "type": tx_type,
            "date": format_display_date(tx_date),
            "bankName": bank_name,
            "status": "settled" if is_auto_settle else "pending",
            "settledDate": format_display_date(tx_date) if is_auto_settle else None,
        }
        user.setdefault("transactions", []).insert(0, tx)
        if tx_type in {"salary", "saving", "lent"} and is_auto_settle:
            add_balance(user, bank_name, float(amount))
        elif tx_type in {"expenditure", "investment"}:
            add_balance(user, bank_name, -float(amount))
        update_current_user(user)
        st.success("Entry added.")
        st.rerun()


def render_transaction_table(user, transactions, compact=False):
    if not transactions:
        st.info("No transactions to show.")
        return

    for tx in transactions:
        amount_prefix = "+" if tx.get("type") in {"lent", "salary", "saving"} else "-"
        with st.container(border=True):
            cols = st.columns([3, 2, 2, 2, 2] if not compact else [4, 2, 2])
            cols[0].markdown(f"**{tx.get('name', 'Untitled')}**")
            cols[0].caption(tx.get("reason") or tx.get("date", ""))
            cols[1].write(TRANSACTION_TYPES.get(tx.get("type"), tx.get("type", "")))
            cols[2].write(f"{amount_prefix}{money(tx.get('amount', 0))}")
            if compact:
                continue
            cols[3].write(tx.get("status", "pending").title())
            action = cols[4].selectbox(
                "Action",
                ["Keep", "Toggle settled", "Delete"],
                key=f"action_{tx.get('id')}",
                label_visibility="collapsed",
            )
            if action == "Toggle settled":
                toggle_transaction(user, tx.get("id"))
                st.rerun()
            if action == "Delete":
                delete_transaction(user, tx.get("id"))
                st.rerun()


def toggle_transaction(user, tx_id):
    today = format_display_date(date.today())
    for tx in user.get("transactions", []):
        if tx.get("id") == tx_id:
            settling = tx.get("status") != "settled"
            tx["status"] = "settled" if settling else "pending"
            tx["settledDate"] = today if settling else None
            amount = float(tx.get("amount") or 0)
            multiplier = 1 if settling else -1
            if tx.get("type") in {"lent", "salary", "saving"}:
                add_balance(user, tx.get("bankName"), amount * multiplier)
            elif tx.get("type") in {"borrowed", "expenditure", "investment"}:
                add_balance(user, tx.get("bankName"), -amount * multiplier)
            break
    update_current_user(user)


def delete_transaction(user, tx_id):
    transactions = user.get("transactions", [])
    kept = []
    removed = None
    for tx in transactions:
        if tx.get("id") == tx_id:
            removed = tx
        else:
            kept.append(tx)
    if removed:
        user["transactions"] = kept
        deleted = user.setdefault("deletedTransactions", [])
        deleted.insert(0, removed)
        user["deletedTransactions"] = deleted[:10]
        update_current_user(user)


def render_transactions(user):
    st.header("Transactions")
    render_transaction_form(user)
    st.divider()

    transactions = user.get("transactions", [])
    filter_type = st.selectbox(
        "Filter",
        ["all", *TRANSACTION_TYPES.keys()],
        format_func=lambda value: "All" if value == "all" else TRANSACTION_TYPES[value],
    )
    if filter_type != "all":
        transactions = [tx for tx in transactions if tx.get("type") == filter_type]
    render_transaction_table(user, transactions)


def render_accounts(user):
    st.header("Accounts")
    accounts = user.setdefault("accounts", [])

    with st.form("account_form", clear_on_submit=True):
        cols = st.columns(3)
        name = cols[0].text_input("Account name")
        balance = cols[1].number_input("Opening balance", step=100.0)
        account_type = cols[2].selectbox("Type", ACCOUNT_TYPES)
        submitted = st.form_submit_button("Add account", use_container_width=True)
    if submitted:
        if not name.strip():
            st.error("Account name is required.")
        elif any(acc.get("name", "").lower() == name.strip().lower() for acc in accounts):
            st.error("An account with this name already exists.")
        else:
            accounts.append({"name": name.strip(), "balance": float(balance), "type": account_type})
            update_current_user(user)
            st.rerun()

    for account in accounts:
        with st.container(border=True):
            cols = st.columns([3, 2, 2, 2])
            cols[0].markdown(f"**{account.get('name')}**")
            cols[0].caption(account.get("type", "Primary"))
            new_balance = cols[1].number_input(
                "Balance",
                value=float(account.get("balance") or 0),
                step=100.0,
                key=f"balance_{account.get('name')}",
            )
            if cols[2].button("Update", key=f"update_{account.get('name')}"):
                account["balance"] = new_balance
                update_current_user(user)
                st.success("Balance updated.")
            if cols[3].button("Delete", key=f"delete_acc_{account.get('name')}"):
                user["accounts"] = [acc for acc in accounts if acc.get("name") != account.get("name")]
                update_current_user(user)
                st.rerun()


def render_assistant(user):
    st.header("Assistant")
    query = st.text_input("Ask about your finances")
    transactions = user.get("transactions", [])
    if query:
        lower_query = query.lower()
        if "spend" in lower_query or "expense" in lower_query:
            total = calc_total(transactions, lambda tx: tx.get("type") == "expenditure")
            st.success(f"Your total expenses are {money(total)}.")
        elif "receive" in lower_query or "pay me" in lower_query:
            total = calc_total(
                transactions,
                lambda tx: tx.get("type") == "lent" and tx.get("status") == "pending",
            )
            st.success(f"You currently have {money(total)} left to receive.")
        elif "invest" in lower_query or "saving" in lower_query:
            total = calc_total(transactions, lambda tx: tx.get("type") in {"investment", "saving"})
            st.success(f"You have saved or invested {money(total)}.")
        else:
            income = calc_total(transactions, lambda tx: tx.get("type") == "salary")
            expenses = calc_total(transactions, lambda tx: tx.get("type") == "expenditure")
            st.success(
                f"Income: {money(income)}. Expenses: {money(expenses)}. Net: {money(income - expenses)}."
            )


def render_settings(user):
    st.header("Settings")
    if user.get("isGuest"):
        st.info("Guest profiles are temporary and are not saved to disk.")
    else:
        st.warning("Profile deletion permanently removes this profile from moneybook_data.json.")
        password = st.text_input("Confirm password", type="password")
        if st.button("Delete profile", type="primary"):
            if password != user.get("password"):
                st.error("Password does not match.")
            else:
                st.session_state.data["users"] = [
                    item
                    for item in st.session_state.data.get("users", [])
                    if item.get("id") != user.get("id")
                ]
                save_data(st.session_state.data)
                st.session_state.active_user_id = None
                st.rerun()


def main():
    ensure_state()
    user = current_user()
    if user is None:
        render_auth()
        return

    user = deepcopy(user)
    page = render_sidebar(user)
    if page == "Dashboard":
        render_dashboard(user)
    elif page == "Transactions":
        render_transactions(user)
    elif page == "Accounts":
        render_accounts(user)
    elif page == "Assistant":
        render_assistant(user)
    elif page == "Settings":
        render_settings(user)


if __name__ == "__main__":
    main()
