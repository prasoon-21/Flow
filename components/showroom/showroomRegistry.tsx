import React, { useState } from 'react';
import { ArrowRight, Bell, Check, Plus, Search } from 'lucide-react';
import { ActivityTimeline, ActivityItem } from '@/components/contacts/ActivityTimeline';
import { EmailAnalyticsCard } from '@/components/email/EmailAnalyticsCard';
import { WhatsappAnalyticsCard } from '@/components/whatsapp/WhatsappAnalyticsCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ContactCard } from '@/components/ui/ContactCard';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { InputField } from '@/components/ui/InputField';
import { InputShell } from '@/components/ui/InputShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TagNotesCard, TagOption } from '@/components/ui/TagNotesCard';
import { TagPill } from '@/components/ui/TagPill';
import { useToast } from '@/components/ui/ToastProvider';

export type ShowroomExample = {
  title: string;
  description?: string;
  render: () => React.ReactNode;
  usage?: string;
  props?: string;
};

export type ShowroomEntry = {
  name: string;
  category: string;
  description?: string;
  examples: ShowroomExample[];
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
);

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
    {children}
  </div>
);

const sampleContact = {
  name: 'Ava Thompson',
  email: 'ava@aurika.io',
  phone: '+1 212 555 0140',
  tags: ['VIP', 'Wholesale'],
  note: 'Prefers WhatsApp updates for delivery changes.',
};

const availableTags: TagOption[] = [
  { id: 'vip', name: 'VIP', category: 'Priority' },
  { id: 'wholesale', name: 'Wholesale', category: 'Sales' },
  { id: 'follow-up', name: 'Follow Up', category: 'Workflow' },
  { id: 'returns', name: 'Returns', category: 'Support' },
  { id: 'priority', name: 'Priority', category: 'Support' },
];

const sampleActivities: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'call',
    timestamp: new Date(Date.now() - 1000 * 60 * 35),
    title: 'Call from Ava Thompson',
    snippet: 'Asked about changing the delivery slot.',
    metadata: { callId: 'CALL-4382', status: 'Missed' },
  },
  {
    id: 'activity-2',
    type: 'order',
    timestamp: new Date(Date.now() - 1000 * 60 * 110),
    title: 'Order #4109',
    snippet: 'Beacon Lamp x2',
    metadata: { orderId: '4109', status: 'Shipped', total: '$189.00' },
  },
  {
    id: 'activity-3',
    type: 'ticket',
    timestamp: new Date(Date.now() - 1000 * 60 * 260),
    title: 'Ticket: Return request',
    snippet: 'Item arrived with minor damage on the base.',
    metadata: { ticketId: 'T-552', status: 'Open' },
  },
  {
    id: 'activity-4',
    type: 'whatsapp',
    timestamp: new Date(Date.now() - 1000 * 60 * 430),
    title: 'WhatsApp: Shipping update',
    snippet: 'Can I move the delivery to next week?',
    metadata: { channel: 'whatsapp' },
  },
  {
    id: 'activity-5',
    type: 'email',
    timestamp: new Date(Date.now() - 1000 * 60 * 720),
    title: 'Email: Warranty details',
    snippet: 'What is covered under the standard warranty?',
    metadata: { status: 'Pending reply' },
  },
];

function ToastExamples() {
  const { showToast } = useToast();
  return (
    <Row>
      <Button
        variant="success"
        size="sm"
        onClick={() =>
          showToast({
            variant: 'success',
            title: 'Saved',
            message: 'Contact details updated.',
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="warning"
        size="sm"
        onClick={() =>
          showToast({
            variant: 'info',
            title: 'Heads up',
            message: 'Sync in progress.',
          })
        }
      >
        Info toast
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() =>
          showToast({
            variant: 'error',
            title: 'Failed',
            message: 'Could not send the update.',
            actionLabel: 'Retry',
            onAction: () => undefined,
          })
        }
      >
        Error toast
      </Button>
    </Row>
  );
}

function DateRangePickerExample() {
  const [value, setValue] = useState({ start: '2024-03-05', end: '2024-03-21' });
  return (
    <DateRangePicker
      value={value}
      onChange={(which, nextValue) => setValue((prev) => ({ ...prev, [which]: nextValue }))}
    />
  );
}

function TagNotesCardExample() {
  const [tags, setTags] = useState<string[]>(['VIP', 'Wholesale']);
  const [note, setNote] = useState('Requested a delivery update before shipping.');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSaving(false);
  };

  const handleReset = () => {
    setTags(['VIP', 'Wholesale']);
    setNote('Requested a delivery update before shipping.');
  };

  return (
    <TagNotesCard
      tags={tags}
      note={note}
      availableTags={availableTags}
      primaryScope="conversation"
      isSaving={isSaving}
      onChangeTags={setTags}
      onChangeNote={setNote}
      onSave={handleSave}
      onReset={handleReset}
    />
  );
}

function ActivityTimelineExample() {
  const formatRelativeTime = (value: Date | string | null) => {
    if (!value) return 'N/A';
    const date = typeof value === 'string' ? new Date(value) : value;
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const formatExactTime = (value: Date | string | null) => {
    if (!value) return 'N/A';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleString();
  };

  return (
    <div style={{ minHeight: 320 }}>
      <ActivityTimeline
        activities={sampleActivities}
        formatRelativeTime={formatRelativeTime}
        formatExactTime={formatExactTime}
      />
    </div>
  );
}

export const showroomRegistry: ShowroomEntry[] = [
  {
    name: 'Button',
    category: 'Actions',
    description: 'Primary action button with variants, sizes, and icon support.',
    examples: [
      {
        title: 'Variants',
        render: () => (
          <Row>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="destructive">Destructive</Button>
          </Row>
        ),
        usage:
          "<Button variant=\"primary\">Primary</Button>\n<Button variant=\"secondary\">Secondary</Button>\n<Button variant=\"outline\">Outline</Button>\n<Button variant=\"ghost\">Ghost</Button>\n<Button variant=\"success\">Success</Button>\n<Button variant=\"warning\">Warning</Button>\n<Button variant=\"destructive\">Destructive</Button>",
        props: '[{ variant: "primary" }, { variant: "secondary" }, { variant: "outline" }]',
      },
      {
        title: 'Sizes',
        render: () => (
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
        ),
        usage: "<Button size=\"sm\">Small</Button>\n<Button size=\"md\">Medium</Button>\n<Button size=\"lg\">Large</Button>",
        props: '[{ size: "sm" }, { size: "md" }, { size: "lg" }]',
      },
      {
        title: 'States and icons',
        render: () => (
          <Row>
            <Button icon={<Plus size={14} />} iconPosition="left">
              New item
            </Button>
            <Button icon={<ArrowRight size={14} />} iconPosition="right">
              Continue
            </Button>
            <Button icon={<Bell size={14} />} aria-label="Notifications" />
            <Button disabled>Disabled</Button>
            <Button disabled>Loading...</Button>
            <Button style={{ maxWidth: 160, whiteSpace: 'normal' }}>
              Send follow up request to the customer
            </Button>
          </Row>
        ),
        usage:
          "<Button icon={<Plus size={14} />}>New item</Button>\n<Button icon={<ArrowRight size={14} />} iconPosition=\"right\">Continue</Button>\n<Button disabled>Disabled</Button>",
        props: '{ icon: <Plus />, iconPosition: "left" }',
      },
    ],
  },
  {
    name: 'Badge',
    category: 'Badges',
    description: 'Inline badge for status and quick labels.',
    examples: [
      {
        title: 'Variants',
        render: () => (
          <Row>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </Row>
        ),
        usage:
          "<Badge variant=\"primary\">Primary</Badge>\n<Badge variant=\"success\">Success</Badge>\n<Badge variant=\"warning\">Warning</Badge>",
        props: '{ variant: "success" }',
      },
      {
        title: 'Sizes and icons',
        render: () => (
          <Row>
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge icon={<Check size={12} />} variant="success">
              Confirmed
            </Badge>
          </Row>
        ),
        usage: "<Badge size=\"sm\">Small</Badge>\n<Badge icon={<Check size={12} />}>Confirmed</Badge>",
        props: '{ size: "sm", icon: <Check /> }',
      },
    ],
  },
  {
    name: 'TagPill',
    category: 'Badges',
    description: 'Compact tag pill with optional remove action.',
    examples: [
      {
        title: 'Static and removable',
        render: () => (
          <Row>
            <TagPill label="Follow Up" />
            <TagPill label="Priority" onRemove={() => undefined} />
          </Row>
        ),
        usage: "<TagPill label=\"Follow Up\" />\n<TagPill label=\"Priority\" onRemove={() => {}} />",
        props: '{ label: "Priority", onRemove: () => {} }',
      },
    ],
  },
  {
    name: 'InputField',
    category: 'Inputs',
    description: 'Text input with label, helper text, and optional icons.',
    examples: [
      {
        title: 'Default and helper text',
        render: () => (
          <Grid>
            <InputField label="Full name" placeholder="Jane Doe" helperText="Shown on tickets and responses." />
            <InputField
              label="Search"
              placeholder="Search conversations"
              icon={<Search size={14} />}
              trailingIcon={<ArrowRight size={14} />}
            />
          </Grid>
        ),
        usage:
          "<InputField label=\"Full name\" placeholder=\"Jane Doe\" helperText=\"Shown on tickets and responses.\" />",
        props: '{ label: "Full name", helperText: "Shown on tickets and responses." }',
      },
      {
        title: 'Multiline and disabled',
        render: () => (
          <Grid>
            <InputField
              label="Internal note"
              multiline
              rows={4}
              defaultValue="Leave a note for the team about next steps."
            />
            <InputField label="Disabled" placeholder="Disabled state" disabled />
          </Grid>
        ),
        usage: "<InputField multiline rows={4} defaultValue=\"Leave a note\" />",
        props: '{ multiline: true, rows: 4 }',
      },
    ],
  },
  {
    name: 'InputShell',
    category: 'Inputs',
    description: 'Wrapper for labels, helper text, and inline errors.',
    examples: [
      {
        title: 'Helper and error',
        render: () => (
          <Grid>
            <InputShell label="Order ID" helper="Use the Shopify order number.">
              <InputField placeholder="4109" />
            </InputShell>
            <InputShell label="Email" error="Please enter a valid email address.">
              <InputField placeholder="name@company.com" />
            </InputShell>
          </Grid>
        ),
        usage:
          "<InputShell label=\"Order ID\" helper=\"Use the Shopify order number.\">\n  <InputField placeholder=\"4109\" />\n</InputShell>",
        props: '{ label: "Order ID", helper: "Use the Shopify order number." }',
      },
    ],
  },
  {
    name: 'DateRangePicker',
    category: 'Inputs',
    description: 'Compact date range control for filtering.',
    examples: [
      {
        title: 'Controlled range',
        render: () => <DateRangePickerExample />,
        usage:
          "<DateRangePicker value={{ start: \"2024-03-05\", end: \"2024-03-21\" }} onChange={(which, next) => {}} />",
        props: '{ value: { start: "2024-03-05", end: "2024-03-21" } }',
      },
    ],
  },
  {
    name: 'Card',
    category: 'Cards',
    description: 'Lightweight container with adjustable padding and radius.',
    examples: [
      {
        title: 'Default and custom',
        render: () => (
          <Grid>
            <Card>
              <Stack>
                <SectionHeader title="Default card" subtitle="Standard padding and radius." />
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Cards are useful for grouping related content and actions.
                </p>
              </Stack>
            </Card>
            <Card padding="20px" rounded="28px" bordered={false}>
              <Stack>
                <SectionHeader title="Custom card" subtitle="Custom padding and border." />
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Use the props to adjust spacing or remove the border entirely.
                </p>
              </Stack>
            </Card>
          </Grid>
        ),
        usage: "<Card padding=\"20px\" rounded=\"28px\" bordered={false}>...</Card>",
        props: '{ padding: "20px", rounded: "28px", bordered: false }',
      },
    ],
  },
  {
    name: 'ContactCard',
    category: 'Cards',
    description: 'Contact profile card with tags and note preview.',
    examples: [
      {
        title: 'Populated and empty',
        render: () => (
          <Grid>
            <ContactCard
              title="Contact details"
              contact={sampleContact}
              action={<Button size="sm" variant="outline">Edit</Button>}
            />
            <ContactCard title="Contact details" contact={null} />
          </Grid>
        ),
        usage: "<ContactCard title=\"Contact details\" contact={contact} />",
        props: '{ title: "Contact details", contact }',
      },
    ],
  },
  {
    name: 'TagNotesCard',
    category: 'Cards',
    description: 'Editable tags and notes panel with inline search.',
    examples: [
      {
        title: 'Interactive',
        render: () => <TagNotesCardExample />,
        usage:
          "<TagNotesCard tags={tags} note={note} availableTags={availableTags} primaryScope=\"conversation\" onChangeTags={setTags} onChangeNote={setNote} onSave={handleSave} />",
        props: '{ tags, note, availableTags, primaryScope }',
      },
      {
        title: 'Placeholder state',
        render: () => (
          <TagNotesCard
            tags={[]}
            note=""
            availableTags={availableTags}
            primaryScope="conversation"
            onChangeTags={() => undefined}
            onChangeNote={() => undefined}
            onSave={async () => undefined}
            allowEdit={false}
            showPlaceholder
          />
        ),
        usage: "<TagNotesCard allowEdit={false} showPlaceholder tags={[]} note=\"\" ... />",
        props: '{ allowEdit: false, showPlaceholder: true }',
      },
    ],
  },
  {
    name: 'SectionHeader',
    category: 'Data Display',
    description: 'Section heading with optional action and subtitle.',
    examples: [
      {
        title: 'With action',
        render: () => (
          <SectionHeader
            title="Recent tickets"
            subtitle="Updated in the last 24 hours"
            action={<Button size="sm">View all</Button>}
          />
        ),
        usage: "<SectionHeader title=\"Recent tickets\" subtitle=\"Updated in the last 24 hours\" action={<Button />} />",
        props: '{ title: "Recent tickets", subtitle: "Updated in the last 24 hours" }',
      },
    ],
  },
  {
    name: 'ActivityTimeline',
    category: 'Data Display',
    description: 'Interactive activity list with filters and details drawer.',
    examples: [
      {
        title: 'Sample activity feed',
        render: () => <ActivityTimelineExample />,
        usage: "<ActivityTimeline activities={activities} formatRelativeTime={fn} formatExactTime={fn} />",
        props: '{ activities }',
      },
    ],
  },
  {
    name: 'Toast',
    category: 'Feedback',
    description: 'Toast notifications with variants and optional actions.',
    examples: [
      {
        title: 'Trigger toasts',
        render: () => <ToastExamples />,
        usage: "const { showToast } = useToast();\nshowToast({ variant: \"success\", title: \"Saved\", message: \"...\" });",
        props: '{ variant: "success", title: "Saved", message: "Contact details updated." }',
      },
    ],
  },
  {
    name: 'EmailAnalyticsCard',
    category: 'Analytics',
    description: 'Email channel snapshot card with KPIs and tag breakdown.',
    examples: [
      {
        title: 'Sample data',
        render: () => (
          <EmailAnalyticsCard
            data={{
              incoming: 1284,
              outgoing: 621,
              conversations: 432,
              uniqueSenders: 198,
              categories: {
                top: [
                  { category: 'Billing', count: 84 },
                  { category: 'Returns', count: 61 },
                  { category: 'Delivery', count: 49 },
                ],
                other: 72,
              },
            }}
          />
        ),
        usage: "<EmailAnalyticsCard data={data} />",
        props: '{ data: { incoming: 1284, outgoing: 621, ... } }',
      },
    ],
  },
  {
    name: 'WhatsappAnalyticsCard',
    category: 'Analytics',
    description: 'WhatsApp channel snapshot card with KPIs and tag breakdown.',
    examples: [
      {
        title: 'Sample data',
        render: () => (
          <WhatsappAnalyticsCard
            data={{
              totalIncoming: 864,
              uniqueSenders: 214,
              categories: {
                total: 312,
                top: [
                  { category: 'Delivery', count: 96 },
                  { category: 'Returns', count: 74 },
                  { category: 'Payments', count: 58 },
                ],
                other: 84,
              },
            }}
          />
        ),
        usage: "<WhatsappAnalyticsCard data={data} />",
        props: '{ data: { totalIncoming: 864, uniqueSenders: 214, ... } }',
      },
    ],
  },
];
