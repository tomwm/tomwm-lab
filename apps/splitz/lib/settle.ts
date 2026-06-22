export type Expense = {
  id: string;
  description: string;
  amount: string | number;
  paid_by: string;
  splits: Record<string, number>;
};

// Balances using per-expense splits
export function calcBalances(members: string[], expenses: Expense[]) {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m] = 0));

  for (const expense of expenses) {
    const total = Number(expense.amount);
    const splits = expense.splits;

    // What each person owes for this expense
    for (const [member, pct] of Object.entries(splits)) {
      balances[member] = (balances[member] ?? 0) - (total * pct) / 100;
    }
    // Payer gets credited
    balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + total;
  }

  return balances;
}

export type Settlement = { from: string; to: string; amount: number };

// Greedy debt settlement algorithm
export function calcSettlements(balances: Record<string, number>): Settlement[] {
  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  for (const [name, balance] of Object.entries(balances)) {
    if (balance > 0.005) creditors.push({ name, amount: balance });
    else if (balance < -0.005) debtors.push({ name, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);

    settlements.push({ from: debt.name, to: credit.name, amount: Math.round(amount * 100) / 100 });

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.005) ci++;
    if (debt.amount < 0.005) di++;
  }

  return settlements;
}

// Balances using overall member shares of total spend
export function calcBalancesGlobal(
  members: string[],
  expenses: Expense[],
  memberShares: Record<string, number>
) {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m] = 0));

  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Credit each payer for what they paid
  for (const expense of expenses) {
    balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + Number(expense.amount);
  }

  // Deduct each person's share of the total
  for (const [member, pct] of Object.entries(memberShares)) {
    balances[member] = (balances[member] ?? 0) - (totalSpend * pct) / 100;
  }

  return balances;
}

// Merge couple balances into a single combined entry before settling
export function mergeCouplesToBalances(
  balances: Record<string, number>,
  couples: [string, string][]
): Record<string, number> {
  const merged = { ...balances };
  for (const [a, b] of couples) {
    if (merged[a] === undefined || merged[b] === undefined) continue;
    const combinedName = `${a} & ${b}`;
    merged[combinedName] = (merged[a] ?? 0) + (merged[b] ?? 0);
    delete merged[a];
    delete merged[b];
  }
  return merged;
}

export function equalSplits(members: string[]) {
  const pct = Math.round((100 / members.length) * 100) / 100;
  const splits: Record<string, number> = {};
  members.forEach((m, i) => {
    splits[m] = i === members.length - 1 ? 100 - pct * (members.length - 1) : pct;
  });
  return splits;
}
