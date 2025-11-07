import { Installment } from '../installment.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

describe('Installment Entity', () => {
  const validProps = {
    template_id: '123e4567-e89b-12d3-a456-426614174000',
    installment_number: 1,
    amount: 100.50,
    due_date: new Date('2024-02-01'),
  };

  describe('Creation', () => {
    it('should create a valid installment', () => {
      const installment = Installment.create(validProps);

      expect(installment).toBeInstanceOf(Installment);
      expect(installment.template_id).toBe(validProps.template_id);
      expect(installment.installment_number).toBe(1);
      expect(installment.amount).toBe(100.50);
      expect(installment.status).toBe(OccurrenceStatus.PENDING);
      expect(installment.transaction_id).toBeNull();
    });

    it('should throw error for invalid template_id', () => {
      expect(() => {
        new Installment({
          ...validProps,
          template_id: 'invalid-uuid',
        });
      }).toThrow();
    });

    it('should throw error for invalid installment_number', () => {
      expect(() => {
        new Installment({
          ...validProps,
          installment_number: 0,
        });
      }).toThrow();
    });

    it('should throw error for negative amount', () => {
      expect(() => {
        new Installment({
          ...validProps,
          amount: -10,
        });
      }).toThrow();
    });
  });

  describe('Status Methods', () => {
    it('should correctly identify pending status', () => {
      const installment = Installment.create(validProps);

      expect(installment.isPending()).toBe(true);
      expect(installment.isPaid()).toBe(false);
      expect(installment.isSkipped()).toBe(false);
    });
  });

  describe('Business Rules', () => {
    it('should identify due installment', () => {
      const today = new Date();
      const installment = Installment.create({
        ...validProps,
        due_date: today,
      });

      expect(installment.isDue()).toBe(true);
    });

    it('should not identify future installment as due', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);

      const installment = Installment.create({
        ...validProps,
        due_date: future,
      });

      expect(installment.isDue()).toBe(false);
    });

    it('should allow paying pending installment', () => {
      const installment = Installment.create(validProps);

      expect(installment.canBePaid()).toBe(true);
    });

    it('should not allow paying overdue installment', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const installment = Installment.create({
        ...validProps,
        due_date: oldDate,
      });

      expect(installment.isOverdue()).toBe(true);
      expect(installment.canBePaid()).toBe(false);
    });
  });

  describe('markAsPaid', () => {
    it('should mark pending installment as paid', () => {
      const installment = Installment.create(validProps);
      const transactionId = '123e4567-e89b-12d3-a456-426614174001';

      installment.markAsPaid(transactionId);

      expect(installment.isPaid()).toBe(true);
      expect(installment.transaction_id).toBe(transactionId);
    });

    it('should throw error when marking non-pending installment as paid', () => {
      const installment = new Installment({
        ...validProps,
        status: OccurrenceStatus.SKIPPED,
      });

      expect(() => {
        installment.markAsPaid('123e4567-e89b-12d3-a456-426614174001');
      }).toThrow('Only pending installments can be marked as paid');
    });

    it('should throw error when transaction ID is missing', () => {
      const installment = Installment.create(validProps);

      expect(() => {
        installment.markAsPaid('');
      }).toThrow('Transaction ID is required to mark as paid');
    });
  });

  describe('markAsSkipped', () => {
    it('should mark pending installment as skipped', () => {
      const installment = Installment.create(validProps);

      installment.markAsSkipped();

      expect(installment.isSkipped()).toBe(true);
    });

    it('should throw error when marking non-pending installment as skipped', () => {
      const installment = new Installment({
        ...validProps,
        status: OccurrenceStatus.PAID,
        transaction_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(() => {
        installment.markAsSkipped();
      }).toThrow('Only pending installments can be skipped');
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const installment = Installment.create(validProps);
      const persistence = installment.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence).toHaveProperty('template_id');
      expect(persistence).toHaveProperty('installment_number');
      expect(persistence).toHaveProperty('amount');
      expect(persistence).toHaveProperty('due_date');
      expect(persistence).toHaveProperty('status');
      expect(persistence).toHaveProperty('transaction_id');
    });
  });
});
