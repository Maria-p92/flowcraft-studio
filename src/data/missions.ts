import type {
    FlowValidation,
    Mission,
    Multiplier,
    NodeKind,
    Rank,
    SlotId,
    SlotState,
  } from '../types/flow';
  
  /* ------------------------------------------------------------------ */
  /* Slot configuration                                                  */
  /* ------------------------------------------------------------------ */
  
  export const SLOT_ORDER: readonly SlotId[] = ['trigger', 'action1', 'action2'];
  
  export const SLOT_KIND: Record<SlotId, NodeKind> = {
    trigger: 'trigger',
    action1: 'action',
    action2: 'action',
  };
  
  export const SLOT_LABEL: Record<SlotId, string> = {
    trigger: 'Trigger',
    action1: 'Action 1',
    action2: 'Action 2',
  };
  
  export const emptySlots = (): SlotState => ({
    trigger: null,
    action1: null,
    action2: null,
  });
  
  /* ------------------------------------------------------------------ */
  /* Missions                                                            */
  /* ------------------------------------------------------------------ */
  
  export const MISSIONS: readonly Mission[] = [
    {
      id: 'lead-intake',
      title: 'Lead Intake Autopilot',
      brief:
        'Every new form response gets copied into a spreadsheet by hand, and sales hears about it hours later. Wire it up so the lead is logged first, then the team is alerted.',
      difficulty: 1,
      hoursSavedPerMonth: 6,
      hint: 'Start with the moment a visitor hits Submit. Log the lead before you alert the team, because sales needs a record to open.',
      solution: {
        trigger: 'form-response',
        action1: 'add-crm-row',
        action2: 'ping-sales',
      },
      nodes: [
        {
          id: 'add-crm-row',
          kind: 'action',
          label: 'Add Row to CRM Sheet',
          description: 'Logs the lead details',
          icon: 'sheet',
          tone: 'emerald',
        },
        {
          id: 'schedule-monday',
          kind: 'trigger',
          label: 'Every Monday, 9:00',
          description: 'Runs on a weekly schedule',
          icon: 'clock',
          tone: 'amber',
        },
        {
          id: 'archive-leads',
          kind: 'action',
          label: 'Archive Old Leads',
          description: 'Moves stale rows away',
          icon: 'archive',
          tone: 'rose',
        },
        {
          id: 'form-response',
          kind: 'trigger',
          label: 'New Form Response',
          description: 'A visitor submits your form',
          icon: 'form',
          tone: 'sky',
        },
        {
          id: 'ping-sales',
          kind: 'action',
          label: 'Ping #sales in Slack',
          description: 'Alerts the team instantly',
          icon: 'chat',
          tone: 'violet',
        },
        {
          id: 'post-social',
          kind: 'action',
          label: 'Post to Social Media',
          description: 'Publishes a public update',
          icon: 'megaphone',
          tone: 'amber',
        },
      ],
      summary: {
        manualEffort: '15 leads/week × 6 min of copy-paste and chasing',
        automatedEffort: 'Logged and announced in under 5 seconds',
        narrative:
          'New leads now land in your CRM sheet and reach sales instantly. No tabs, no copy-paste, no dropped leads.',
      },
    },
    {
      id: 'invoice-chaser',
      title: 'Invoice Chaser',
      brief:
        'Late invoices slip through the cracks until someone remembers to check. Build a flow that nudges the client first, then gives your team a task to follow up.',
      difficulty: 2,
      hoursSavedPerMonth: 14,
      hint: 'Late payment is what kicks this off. Nudge the client before you create work for your team.',
      solution: {
        trigger: 'invoice-overdue',
        action1: 'send-reminder',
        action2: 'create-task',
      },
      nodes: [
        {
          id: 'issue-refund',
          kind: 'action',
          label: 'Issue Refund',
          description: 'Returns money to the client',
          icon: 'refund',
          tone: 'rose',
        },
        {
          id: 'new-customer',
          kind: 'trigger',
          label: 'New Customer Signed Up',
          description: 'A new account is created',
          icon: 'user-plus',
          tone: 'sky',
        },
        {
          id: 'send-reminder',
          kind: 'action',
          label: 'Send Payment Reminder',
          description: 'Friendly email to the client',
          icon: 'mail',
          tone: 'sky',
        },
        {
          id: 'invoice-paid',
          kind: 'trigger',
          label: 'Invoice Marked Paid',
          description: 'Payment has been received',
          icon: 'wallet',
          tone: 'emerald',
        },
        {
          id: 'invoice-overdue',
          kind: 'trigger',
          label: 'Invoice 7 Days Overdue',
          description: 'Fires when payment is late',
          icon: 'receipt',
          tone: 'rose',
        },
        {
          id: 'send-gift',
          kind: 'action',
          label: 'Send Thank-You Gift',
          description: 'Ships a small present',
          icon: 'gift',
          tone: 'amber',
        },
        {
          id: 'create-task',
          kind: 'action',
          label: 'Create Follow-up Task',
          description: 'Assigns it to your finance team',
          icon: 'task',
          tone: 'violet',
        },
      ],
      summary: {
        manualEffort: '30 overdue invoices/month × 28 min of chasing',
        automatedEffort: 'Reminder sent on day 7, follow-up task created automatically',
        narrative:
          'Overdue invoices now trigger a polite reminder and a tracked follow-up task, so nothing waits on someone’s memory.',
      },
    },
    {
      id: 'customer-onboarding',
      title: 'Customer Onboarding Pipeline',
      brief:
        'Paying customers wait days for access while your team juggles accounts and calendars. Automate the first hour, from payment to kickoff.',
      difficulty: 3,
      hoursSavedPerMonth: 22,
      hint: 'Only a successful payment should start onboarding. Provision the account first, then book the call, because nobody wants a kickoff without a login.',
      solution: {
        trigger: 'payment-succeeded',
        action1: 'create-workspace',
        action2: 'schedule-kickoff',
      },
      nodes: [
        {
          id: 'send-survey',
          kind: 'action',
          label: 'Send Churn Survey',
          description: 'Asks why someone left',
          icon: 'survey',
          tone: 'amber',
        },
        {
          id: 'payment-failed',
          kind: 'trigger',
          label: 'Payment Failed',
          description: 'A card was declined',
          icon: 'alert',
          tone: 'rose',
        },
        {
          id: 'create-workspace',
          kind: 'action',
          label: 'Create Workspace Account',
          description: 'Provisions login and seats',
          icon: 'user-plus',
          tone: 'indigo',
        },
        {
          id: 'downgrade-plan',
          kind: 'action',
          label: 'Downgrade to Free Plan',
          description: 'Reduces account limits',
          icon: 'trending-down',
          tone: 'rose',
        },
        {
          id: 'payment-succeeded',
          kind: 'trigger',
          label: 'Payment Succeeded',
          description: 'A new customer has paid',
          icon: 'wallet',
          tone: 'emerald',
        },
        {
          id: 'trial-ending',
          kind: 'trigger',
          label: 'Trial Ends in 3 Days',
          description: 'Fires before a trial expires',
          icon: 'clock',
          tone: 'amber',
        },
        {
          id: 'schedule-kickoff',
          kind: 'action',
          label: 'Schedule Kickoff Call',
          description: 'Books time on your calendar',
          icon: 'video',
          tone: 'violet',
        },
        {
          id: 'send-overdue-notice',
          kind: 'action',
          label: 'Send Overdue Notice',
          description: 'Warns about unpaid balance',
          icon: 'mail',
          tone: 'sky',
        },
      ],
      summary: {
        manualEffort: '20 new customers/month × 66 min of setup and scheduling',
        automatedEffort: 'Account ready and kickoff booked within a minute of payment',
        narrative:
          'Every paying customer now gets a ready workspace and a booked kickoff before they finish their coffee.',
      },
    },
  ];
  
  /* ------------------------------------------------------------------ */
  /* Game rules                                                          */
  /* ------------------------------------------------------------------ */
  
  /** 0 or 1 clean missions in a row → 1x, 2 → 2x, 3+ → 3x. */
  export function getMultiplier(streak: number): Multiplier {
    if (streak >= 2) return 3;
    if (streak === 1) return 2;
    return 1;
  }
  
  export function getRank(completedMissions: number): Rank {
    if (completedMissions >= MISSIONS.length) return 'Flow Architect';
    if (completedMissions >= 1) return 'Ops Specialist';
    return 'No-Code Apprentice';
  }
  
  export function validateFlow(mission: Mission, slots: SlotState): FlowValidation {
    const missing = SLOT_ORDER.filter((slot) => slots[slot] === null);
    if (missing.length > 0) return { status: 'incomplete', missing };
  
    const wrongSlots = SLOT_ORDER.filter((slot) => slots[slot] !== mission.solution[slot]);
    const firstWrong = wrongSlots[0];
    if (firstWrong === undefined) return { status: 'correct' };
  
    return { status: 'incorrect', wrongSlots, firstWrong };
  }