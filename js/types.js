const Role = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
};

const AccountStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
};

const CarStatus = {
  AVAILABLE: 'AVAILABLE',
  RENTED: 'RENTED',
  MAINTENANCE: 'MAINTENANCE',
};

const ContractStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const PaymentStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
};

window.Role = Role;
window.AccountStatus = AccountStatus;
window.CarStatus = CarStatus;
window.ContractStatus = ContractStatus;
window.PaymentStatus = PaymentStatus;