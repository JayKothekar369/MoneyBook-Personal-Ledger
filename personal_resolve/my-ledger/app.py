import json
from copy import deepcopy
from datetime import date, datetime
from html import escape
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


def h(value):
    return escape(str(value or ""))


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


def inject_css():
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
            --bg: #020617;
            --panel: rgba(15, 23, 42, 0.72);
            --panel-strong: rgba(15, 23, 42, 0.92);
            --line: rgba(148, 163, 184, 0.18);
            --muted: #94a3b8;
            --text: #e2e8f0;
            --indigo: #818cf8;
            --cyan: #22d3ee;
            --emerald: #34d399;
            --rose: #fb7185;
            --amber: #fbbf24;
        }

        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }

        .stApp {
            color: var(--text);
            background:
                radial-gradient(circle at 18% 8%, rgba(34, 211, 238, 0.18), transparent 28rem),
                radial-gradient(circle at 82% 0%, rgba(129, 140, 248, 0.22), transparent 30rem),
                linear-gradient(135deg, #020617 0%, #0f172a 56%, #111827 100%);
        }

        section[data-testid="stSidebar"] {
            background: rgba(2, 6, 23, 0.82);
            border-right: 1px solid var(--line);
        }

        .block-container {
            padding-top: 2.2rem;
            padding-bottom: 3rem;
        }

        h1, h2, h3 {
            letter-spacing: 0;
        }

        div[data-testid="stMetric"],
        div[data-testid="stForm"],
        div[data-testid="stVerticalBlockBorderWrapper"] {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(18px);
        }

        div[data-testid="stMetric"] {
            padding: 1rem 1.1rem;
        }

        div[data-testid="stMetricLabel"] p {
            color: var(--muted);
            font-size: 0.74rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        div[data-testid="stMetricValue"] {
            color: white;
            font-weight: 800;
        }

        div[data-testid="stForm"] {
            padding: 1rem 1rem 1.2rem;
        }

        .stTextInput input,
        .stNumberInput input,
        .stDateInput input,
        .stSelectbox div[data-baseweb="select"] > div {
            background: rgba(2, 6, 23, 0.72);
            border: 1px solid var(--line);
            border-radius: 14px;
            color: var(--text);
        }

        .stButton > button,
        .stFormSubmitButton > button {
            border: 0;
            border-radius: 14px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            font-weight: 800;
            box-shadow: 0 12px 30px rgba(79, 70, 229, 0.28);
        }

        .stButton > button:hover,
        .stFormSubmitButton > button:hover {
            border: 0;
            color: white;
            filter: brightness(1.08);
        }

        .moneybook-hero {
            padding: 1.4rem 1.6rem;
            margin-bottom: 1.1rem;
            border: 1px solid var(--line);
            border-radius: 24px;
            background:
                linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.68)),
                radial-gradient(circle at 92% 8%, rgba(34, 211, 238, 0.14), transparent 18rem);
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
        }

        .moneybook-kicker {
            color: var(--cyan);
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            margin-bottom: 0.3rem;
        }

        .moneybook-title {
            color: white;
            font-size: clamp(2rem, 4vw, 3.2rem);
            font-weight: 900;
            line-height: 1.05;
            margin: 0;
        }

        .moneybook-subtitle {
            color: var(--muted);
            margin-top: 0.6rem;
            max-width: 54rem;
        }

        .metric-card,
        .tx-card,
        .account-card {
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 1rem;
            background: var(--panel);
            box-shadow: 0 20px 55px rgba(0, 0, 0, 0.22);
            min-height: 112px;
        }

        .metric-label,
        .tx-meta,
        .account-type {
            color: var(--muted);
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .metric-value {
            color: white;
            font-size: 1.7rem;
            font-weight: 900;
            margin-top: 0.5rem;
        }

        .metric-small {
            color: var(--muted);
            font-size: 0.82rem;
            margin-top: 0.2rem;
        }

        .tone-emerald { border-color: rgba(52, 211, 153, 0.3); }
        .tone-emerald .metric-value, .amount-positive { color: var(--emerald); }
        .tone-rose { border-color: rgba(251, 113, 133, 0.3); }
        .tone-rose .metric-value, .amount-negative { color: var(--rose); }
        .tone-amber { border-color: rgba(251, 191, 36, 0.3); }
        .tone-amber .metric-value { color: var(--amber); }
        .tone-indigo { border-color: rgba(129, 140, 248, 0.35); }
        .tone-indigo .metric-value { color: var(--indigo); }

        .tx-card {
            min-height: auto;
            margin-bottom: 0.7rem;
        }

        .tx-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        .tx-title,
        .account-name {
            color: white;
            font-weight: 850;
            font-size: 1rem;
        }

        .tx-pill {
            display: inline-flex;
            margin-top: 0.55rem;
            padding: 0.22rem 0.55rem;
            border-radius: 999px;
            background: rgba(129, 140, 248, 0.12);
            color: #c4b5fd;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .tx-amount {
            font-size: 1.08rem;
            font-weight: 900;
            white-space: nowrap;
        }

        .account-card {
            min-height: 122px;
        }

        .account-balance {
            color: white;
            font-size: 1.6rem;
            font-weight: 900;
            margin-top: 0.5rem;
        }

        .auth-shell {
            max-width: 760px;
            margin: 1rem auto;
            text-align: center;
        }

        @media (max-width: 700px) {
            .block-container {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .tx-row {
                align-items: flex-start;
                flex-direction: column;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_hero(title, subtitle, kicker="MoneyBook"):
    st.markdown(
        f"""
        <div class="moneybook-hero">
            <div class="moneybook-kicker">{h(kicker)}</div>
            <h1 class="moneybook-title">{h(title)}</h1>
            <div class="moneybook-subtitle">{h(subtitle)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_metric_card(label, value, helper="", tone="indigo"):
    st.markdown(
        f"""
        <div class="metric-card tone-{tone}">
            <div class="metric-label">{h(label)}</div>
            <div class="metric-value">{h(value)}</div>
            <div class="metric-small">{h(helper)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_account_card(account):
    st.markdown(
        f"""
        <div class="account-card">
            <div class="account-name">{h(account.get('name', 'Account'))}</div>
            <div class="account-type">{h(account.get('type', 'Primary'))}</div>
            <div class="account-balance">{h(money(account.get('balance', 0)))}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_auth():
    st.markdown('<div class="auth-shell">', unsafe_allow_html=True)
    render_hero(
        "MoneyBook",
        "Track accounts, expenses, savings, lending, and borrowing from one calm dashboard.",
        "Personal Ledger",
    )
    st.markdown("</div>", unsafe_allow_html=True)

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
    render_hero(
        "Dashboard",
        f"Welcome back, {user.get('name', 'there')}. Here is your money snapshot.",
    )
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
    with cols[0]:
        render_metric_card(
            "To receive",
            money(calc_total(transactions, lambda tx: tx.get("type") == "lent" and tx.get("status") == "pending")),
            "Pending lent amount",
            "emerald",
        )
    with cols[1]:
        render_metric_card(
            "To pay",
            money(calc_total(transactions, lambda tx: tx.get("type") == "borrowed" and tx.get("status") == "pending")),
            "Pending borrowed amount",
            "rose",
        )
    with cols[2]:
        render_metric_card("Spent this month", money(month_spent), f"All time {money(total_spent)}", "amber")
    with cols[3]:
        render_metric_card("Saved / invested", money(month_saved), f"All time {money(total_saved)}", "indigo")

    st.subheader("Salary overview")
    salary_cols = st.columns(2)
    with salary_cols[0]:
        render_metric_card("All-time salary", money(total_salary), "Total salary income", "indigo")
    with salary_cols[1]:
        render_metric_card("Selected month salary", money(month_salary), selected_month, "emerald")

    st.subheader("Account balances")
    if accounts:
        account_cols = st.columns(min(4, len(accounts)))
        for index, account in enumerate(accounts):
            with account_cols[index % len(account_cols)]:
                render_account_card(account)
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
        amount_class = "amount-positive" if amount_prefix == "+" else "amount-negative"
        with st.container(border=True):
            st.markdown(
                f"""
                <div class="tx-card">
                    <div class="tx-row">
                        <div>
                            <div class="tx-title">{h(tx.get('name', 'Untitled'))}</div>
                            <div class="tx-meta">{h(tx.get('reason') or tx.get('date', ''))}</div>
                            <div class="tx-pill">{h(TRANSACTION_TYPES.get(tx.get('type'), tx.get('type', '')))}</div>
                        </div>
                        <div class="tx-amount {amount_class}">{h(amount_prefix + money(tx.get('amount', 0)))}</div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            if compact:
                continue
            cols = st.columns([3, 2, 2, 2, 2] if not compact else [4, 2, 2])
            cols[0].caption(tx.get("date", ""))
            cols[1].caption(tx.get("bankName", ""))
            cols[2].caption(tx.get("status", "pending").title())
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
    render_hero("Transactions", "Add entries and manage settlement status from one place.")
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
    render_hero("Accounts", "Create accounts, update balances, and keep each money source visible.")
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
    render_hero("Assistant", "Ask quick questions about your spending, savings, and balances.")
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
    render_hero("Settings", "Manage this profile and deployment-safe data options.")
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
    inject_css()
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
