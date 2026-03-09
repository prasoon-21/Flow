export type IssueTag = {
  category: string;
  tag: string;
};

export const ISSUE_TAXONOMY: IssueTag[] = [
  { category: 'Product Related Issue', tag: 'Defective or damaged product' },
  { category: 'Product Related Issue', tag: 'Product not as described' },
  { category: 'Product Related Issue', tag: 'Wrong item received' },
  { category: 'Product Related Issue', tag: 'Poor quality or performance' },
  { category: 'Product Related Issue', tag: 'Expired product' },
  { category: 'Product Related Issue', tag: 'Packaging issues' },
  { category: 'Product Related Issue', tag: 'Product safety concerns' },

  { category: 'Delivery Issue', tag: 'Delayed delivery' },
  { category: 'Delivery Issue', tag: 'Non-delivery or lost package' },
  { category: 'Delivery Issue', tag: 'Wrong delivery address' },
  { category: 'Delivery Issue', tag: 'Damaged package during transit' },
  { category: 'Delivery Issue', tag: 'Unprofessional delivery personnel' },
  { category: 'Delivery Issue', tag: 'No delivery updates or tracking information' },

  { category: 'Payment Issue', tag: 'Double charged' },
  { category: 'Payment Issue', tag: 'Payment failed but amount deducted' },
  { category: 'Payment Issue', tag: 'Issues with payment gateway' },
  { category: 'Payment Issue', tag: 'Promo code not applied' },

  { category: 'Refund Issue', tag: 'Refund not received' },
  { category: 'Refund Issue', tag: 'Partial refund instead of full' },
  { category: 'Refund Issue', tag: 'Refund taking too long' },
  { category: 'Refund Issue', tag: 'Incorrect refund amount' },
  { category: 'Refund Issue', tag: 'Refund processed to wrong account' },
  { category: 'Refund Issue', tag: 'Return accepted but refund not initiated' },
];

export default ISSUE_TAXONOMY;
