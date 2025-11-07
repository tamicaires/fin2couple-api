import { RecurringOccurrence } from '../recurring-occurrence.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

describe('RecurringOccurrence Entity', () => {
  const validProps = {
    template_id: '123e4567-e89b-12d3-a456-426614174000',
    due_date: new Date('2024-02-01'),
  };

  describe('Creation', () => {
    it('should create a valid recurring occurrence', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      expect(occurrence).toBeInstanceOf(RecurringOccurrence);
      expect(occurrence.template_id).toBe(validProps.template_id);
      expect(occurrence.due_date).toEqual(validProps.due_date);
      expect(occurrence.status).toBe(OccurrenceStatus.PENDING);
      expect(occurrence.transaction_id).toBeNull();
    });

    it('should generate a unique ID', () => {
      const occurrence1 = RecurringOccurrence.create(validProps);
      const occurrence2 = RecurringOccurrence.create(validProps);

      expect(occurrence1.id).toBeDefined();
      expect(occurrence2.id).toBeDefined();
      expect(occurrence1.id).not.toBe(occurrence2.id);
    });

    it('should throw error for invalid template_id', () => {
      expect(() => {
        new RecurringOccurrence({
          ...validProps,
          template_id: 'invalid-uuid',
        });
      }).toThrow();
    });

    it('should throw error for missing due_date', () => {
      expect(() => {
        new RecurringOccurrence({
          template_id: validProps.template_id,
          due_date: null as any,
        });
      }).toThrow();
    });
  });

  describe('Status Methods', () => {
    it('should correctly identify pending status', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      expect(occurrence.isPending()).toBe(true);
      expect(occurrence.isPaid()).toBe(false);
      expect(occurrence.isSkipped()).toBe(false);
    });

    it('should correctly identify paid status', () => {
      const occurrence = new RecurringOccurrence({
        ...validProps,
        status: OccurrenceStatus.PAID,
        transaction_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(occurrence.isPending()).toBe(false);
      expect(occurrence.isPaid()).toBe(true);
      expect(occurrence.isSkipped()).toBe(false);
    });

    it('should correctly identify skipped status', () => {
      const occurrence = new RecurringOccurrence({
        ...validProps,
        status: OccurrenceStatus.SKIPPED,
      });

      expect(occurrence.isPending()).toBe(false);
      expect(occurrence.isPaid()).toBe(false);
      expect(occurrence.isSkipped()).toBe(true);
    });
  });

  describe('Business Rules', () => {
    it('should allow paying pending occurrence', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      expect(occurrence.canBePaid()).toBe(true);
    });

    it('should not allow paying overdue occurrence', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days ago

      const occurrence = RecurringOccurrence.create({
        ...validProps,
        due_date: oldDate,
      });

      expect(occurrence.isOverdue()).toBe(true);
      expect(occurrence.canBePaid()).toBe(false);
    });

    it('should allow skipping pending occurrence', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      expect(occurrence.canBeSkipped()).toBe(true);
    });

    it('should not allow skipping paid occurrence', () => {
      const occurrence = new RecurringOccurrence({
        ...validProps,
        status: OccurrenceStatus.PAID,
        transaction_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(occurrence.canBeSkipped()).toBe(false);
    });
  });

  describe('markAsPaid', () => {
    it('should mark pending occurrence as paid', () => {
      const occurrence = RecurringOccurrence.create(validProps);
      const transactionId = '123e4567-e89b-12d3-a456-426614174001';

      occurrence.markAsPaid(transactionId);

      expect(occurrence.isPaid()).toBe(true);
      expect(occurrence.transaction_id).toBe(transactionId);
    });

    it('should throw error when marking non-pending occurrence as paid', () => {
      const occurrence = new RecurringOccurrence({
        ...validProps,
        status: OccurrenceStatus.SKIPPED,
      });

      expect(() => {
        occurrence.markAsPaid('123e4567-e89b-12d3-a456-426614174001');
      }).toThrow('Only pending occurrences can be marked as paid');
    });

    it('should throw error when transaction ID is missing', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      expect(() => {
        occurrence.markAsPaid('');
      }).toThrow('Transaction ID is required to mark as paid');
    });
  });

  describe('markAsSkipped', () => {
    it('should mark pending occurrence as skipped', () => {
      const occurrence = RecurringOccurrence.create(validProps);

      occurrence.markAsSkipped();

      expect(occurrence.isSkipped()).toBe(true);
    });

    it('should throw error when marking non-pending occurrence as skipped', () => {
      const occurrence = new RecurringOccurrence({
        ...validProps,
        status: OccurrenceStatus.PAID,
        transaction_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(() => {
        occurrence.markAsSkipped();
      }).toThrow('Only pending occurrences can be skipped');
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const occurrence = RecurringOccurrence.create(validProps);
      const persistence = occurrence.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence).toHaveProperty('template_id');
      expect(persistence).toHaveProperty('due_date');
      expect(persistence).toHaveProperty('status');
      expect(persistence).toHaveProperty('transaction_id');
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });
  });
});
