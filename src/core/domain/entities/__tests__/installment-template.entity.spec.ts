import { InstallmentTemplate } from '../installment-template.entity';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

describe('InstallmentTemplate Entity', () => {
  const validProps = {
    couple_id: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Test Purchase',
    total_amount: 1200,
    total_installments: 12,
    paid_by_id: '123e4567-e89b-12d3-a456-426614174001',
    account_id: '123e4567-e89b-12d3-a456-426614174002',
    category_id: '123e4567-e89b-12d3-a456-426614174003',
    is_couple_expense: true,
    is_free_spending: false,
    visibility: TransactionVisibility.SHARED,
    first_due_date: new Date('2024-02-01'),
  };

  describe('Creation', () => {
    it('should create a valid installment template', () => {
      const template = InstallmentTemplate.create(validProps);

      expect(template).toBeInstanceOf(InstallmentTemplate);
      expect(template.total_amount).toBe(1200);
      expect(template.total_installments).toBe(12);
      expect(template.is_active).toBe(true);
    });

    it('should throw error for less than 2 installments', () => {
      expect(() => {
        InstallmentTemplate.create({
          ...validProps,
          total_installments: 1,
        });
      }).toThrow();
    });

    it('should throw error for more than 120 installments', () => {
      expect(() => {
        InstallmentTemplate.create({
          ...validProps,
          total_installments: 121,
        });
      }).toThrow();
    });

    it('should throw error for negative total_amount', () => {
      expect(() => {
        InstallmentTemplate.create({
          ...validProps,
          total_amount: -100,
        });
      }).toThrow();
    });
  });

  describe('Business Methods', () => {
    it('should calculate installment amount correctly', () => {
      const template = InstallmentTemplate.create(validProps);
      const installmentAmount = template.getInstallmentAmount();

      expect(installmentAmount).toBe(100); // 1200 / 12
    });

    it('should calculate due date for installments', () => {
      const template = InstallmentTemplate.create(validProps);

      const firstInstallment = template.calculateDueDate(1);
      const secondInstallment = template.calculateDueDate(2);
      const lastInstallment = template.calculateDueDate(12);

      expect(firstInstallment.getMonth()).toBe(1); // February (0-indexed)
      expect(secondInstallment.getMonth()).toBe(2); // March
      expect(lastInstallment.getMonth()).toBe(1); // February next year
      expect(lastInstallment.getFullYear()).toBe(2025);
    });

    it('should throw error for invalid installment number', () => {
      const template = InstallmentTemplate.create(validProps);

      expect(() => {
        template.calculateDueDate(0);
      }).toThrow('Invalid installment number');

      expect(() => {
        template.calculateDueDate(13);
      }).toThrow('Invalid installment number');
    });

    it('should identify active template', () => {
      const template = InstallmentTemplate.create(validProps);

      expect(template.isActive()).toBe(true);
    });

    it('should deactivate template', () => {
      const template = InstallmentTemplate.create(validProps);

      template.deactivate();

      expect(template.is_active).toBe(false);
      expect(template.isActive()).toBe(false);
    });

    it('should activate template', () => {
      const template = InstallmentTemplate.create({
        ...validProps,
        is_active: false,
      });

      template.activate();

      expect(template.is_active).toBe(true);
      expect(template.isActive()).toBe(true);
    });

    it('should throw error when deactivating already inactive template', () => {
      const template = InstallmentTemplate.create(validProps);
      template.deactivate();

      expect(() => {
        template.deactivate();
      }).toThrow('Template is already inactive');
    });

    it('should throw error when activating already active template', () => {
      const template = InstallmentTemplate.create(validProps);

      expect(() => {
        template.activate();
      }).toThrow('Template is already active');
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const template = InstallmentTemplate.create(validProps);
      const persistence = template.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence).toHaveProperty('couple_id');
      expect(persistence).toHaveProperty('total_amount');
      expect(persistence).toHaveProperty('total_installments');
      expect(persistence).toHaveProperty('is_active');
    });
  });
});
