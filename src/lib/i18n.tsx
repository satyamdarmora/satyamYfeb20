'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type Lang = 'en' | 'hi';

// ---------------------------------------------------------------------------
// Translation dictionary
// ---------------------------------------------------------------------------

const translations: Record<string, Record<Lang, string>> = {
  // ---- AssuranceStrip ----
  'assurance.activeBase': { en: 'Active Base', hi: '\u0938\u0915\u094D\u0930\u093F\u092F \u092C\u0947\u0938' },
  'assurance.cycleEarnings': { en: 'Cycle Earnings', hi: '\u0938\u093E\u0907\u0915\u0932 \u0915\u092E\u093E\u0908' },
  'assurance.slaStanding': { en: 'SLA Standing', hi: 'SLA \u0938\u094D\u0925\u093F\u0924\u093F' },
  'assurance.exposure': { en: 'Exposure', hi: '\u090F\u0915\u094D\u0938\u094D\u092A\u094B\u095B\u0930' },
  'assurance.connections': { en: 'connections', hi: '\u0915\u0928\u0947\u0915\u094D\u0936\u0928' },
  'assurance.currentCount': { en: 'Current Count', hi: '\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0917\u093F\u0928\u0924\u0940' },
  'assurance.recentChanges': { en: 'Recent Changes', hi: '\u0939\u093E\u0932 \u0915\u0947 \u092C\u0926\u0932\u093E\u0935' },
  'assurance.cycleEarned': { en: 'Cycle Earned', hi: '\u0938\u093E\u0907\u0915\u0932 \u0915\u092E\u093E\u0908' },
  'assurance.nextSettlement': { en: 'Next Settlement', hi: '\u0905\u0917\u0932\u093E \u0938\u0947\u091F\u0932\u092E\u0947\u0902\u091F' },
  'assurance.cycleNote': {
    en: 'This shows current cycle earnings only. For full financial details including bonus breakdown, settlement history, and lifetime earnings, visit',
    hi: '\u092F\u0939 \u0915\u0947\u0935\u0932 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0938\u093E\u0907\u0915\u0932 \u0915\u0940 \u0915\u092E\u093E\u0908 \u0926\u093F\u0916\u093E\u0924\u093E \u0939\u0948\u0964 \u092C\u094B\u0928\u0938, \u0938\u0947\u091F\u0932\u092E\u0947\u0902\u091F \u0907\u0924\u093F\u0939\u093E\u0938 \u0914\u0930 \u0915\u0941\u0932 \u0915\u092E\u093E\u0908 \u0915\u0947 \u0932\u093F\u090F \u0926\u0947\u0916\u0947\u0902',
  },
  'assurance.wallet': { en: 'Wallet', hi: '\u0935\u0949\u0932\u0947\u091F' },
  'assurance.fromMenu': { en: 'from the menu.', hi: '\u092E\u0947\u0928\u094D\u092F\u0942 \u0938\u0947\u0964' },
  'assurance.currentStatus': { en: 'Current Status', hi: '\u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0938\u094D\u0925\u093F\u0924\u093F' },
  'assurance.activeRestores': { en: 'Active Restores', hi: '\u0938\u0915\u094D\u0930\u093F\u092F \u0930\u093F\u0938\u094D\u091F\u094B\u0930' },
  'assurance.unresolvedCount': { en: 'Unresolved Count', hi: '\u0905\u0928\u0938\u0941\u0932\u091D\u0940 \u0917\u093F\u0928\u0924\u0940' },
  'assurance.slaNote': {
    en: 'SLA compliance is determined by the ratio of restores resolved within the SLA deadline versus total restore tasks in the current settlement cycle. Maintaining "Compliant" status ensures full settlement eligibility.',
    hi: 'SLA \u0905\u0928\u0941\u092A\u093E\u0932\u0928 SLA \u0938\u092E\u092F\u0938\u0940\u092E\u093E \u0915\u0947 \u0905\u0902\u0926\u0930 \u0939\u0932 \u0915\u093F\u090F \u0917\u090F \u0930\u093F\u0938\u094D\u091F\u094B\u0930 \u0914\u0930 \u0915\u0941\u0932 \u0930\u093F\u0938\u094D\u091F\u094B\u0930 \u0915\u0947 \u0905\u0928\u0941\u092A\u093E\u0924 \u0938\u0947 \u0928\u093F\u0930\u094D\u0927\u093E\u0930\u093F\u0924 \u0939\u094B\u0924\u093E \u0939\u0948\u0964 "\u0905\u0928\u0941\u092A\u093E\u0932\u0915" \u0938\u094D\u0925\u093F\u0924\u093F \u092C\u0928\u093E\u090F \u0930\u0916\u0928\u0947 \u0938\u0947 \u092A\u0942\u0930\u094D\u0923 \u0938\u0947\u091F\u0932\u092E\u0947\u0902\u091F \u092A\u093E\u0924\u094D\u0930\u0924\u093E \u0938\u0941\u0928\u093F\u0936\u094D\u091A\u093F\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964',
  },
  'assurance.reasonCode': { en: 'Reason Code', hi: '\u0915\u093E\u0930\u0923 \u0915\u094B\u0921' },
  'assurance.effectiveSince': { en: 'Effective Since', hi: '\u092A\u094D\u0930\u092D\u093E\u0935\u0940 \u0924\u093F\u0925\u093F' },
  'assurance.qualSignal': { en: 'Qualitative Signal', hi: '\u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E \u0938\u0902\u0915\u0947\u0924' },
  'assurance.exposureOk': {
    en: 'All metrics are within acceptable thresholds. Continue maintaining current standards.',
    hi: '\u0938\u092D\u0940 \u092E\u0947\u091F\u094D\u0930\u093F\u0915\u094D\u0938 \u0938\u094D\u0935\u0940\u0915\u093E\u0930\u094D\u092F \u0938\u0940\u092E\u093E \u0915\u0947 \u0905\u0902\u0926\u0930 \u0939\u0948\u0902\u0964 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092E\u093E\u0928\u0915 \u092C\u0928\u093E\u090F \u0930\u0916\u0947\u0902\u0964',
  },
  'assurance.exposureLimited': {
    en: 'Some metrics are approaching threshold limits. Review active tasks and prioritize SLA compliance.',
    hi: '\u0915\u0941\u091B \u092E\u0947\u091F\u094D\u0930\u093F\u0915\u094D\u0938 \u0938\u0940\u092E\u093E \u0915\u0947 \u0928\u091C\u0926\u0940\u0915 \u092A\u0939\u0941\u0901\u091A \u0930\u0939\u0947 \u0939\u0948\u0902\u0964 \u0938\u0915\u094D\u0930\u093F\u092F \u0915\u093E\u0930\u094D\u092F\u094B\u0902 \u0915\u0940 \u0938\u092E\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902 \u0914\u0930 SLA \u0905\u0928\u0941\u092A\u093E\u0932\u0928 \u0915\u094B \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915\u0924\u093E \u0926\u0947\u0902\u0964',
  },
  'assurance.exposureCritical': {
    en: 'Critical metrics have breached thresholds. Immediate corrective action required to restore eligibility.',
    hi: '\u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u092E\u0947\u091F\u094D\u0930\u093F\u0915\u094D\u0938 \u0928\u0947 \u0938\u0940\u092E\u093E \u0924\u094B\u0921\u093C\u0940 \u0939\u0948\u0964 \u092A\u093E\u0924\u094D\u0930\u0924\u093E \u092C\u0939\u093E\u0932 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0924\u0941\u0930\u0902\u0924 \u0938\u0941\u0927\u093E\u0930\u093E\u0924\u094D\u092E\u0915 \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908 \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964',
  },

  // SLA standing values
  'sla.compliant': { en: 'Compliant', hi: '\u0905\u0928\u0941\u092A\u093E\u0932\u0915' },
  'sla.atRisk': { en: 'At Risk', hi: '\u091C\u094B\u0916\u093F\u092E \u092E\u0947\u0902' },
  'sla.nonCompliant': { en: 'Non-Compliant', hi: '\u0917\u0948\u0930-\u0905\u0928\u0941\u092A\u093E\u0932\u0915' },

  // Exposure values
  'exposure.eligible': { en: 'ELIGIBLE', hi: '\u092A\u093E\u0924\u094D\u0930' },
  'exposure.limited': { en: 'LIMITED', hi: '\u0938\u0940\u092E\u093F\u0924' },
  'exposure.ineligible': { en: 'INELIGIBLE', hi: '\u0905\u092A\u093E\u0924\u094D\u0930' },

  // ---- TaskFeed ----
  'feed.yourTasks': { en: 'Your Tasks', hi: '\u0906\u092A\u0915\u0947 \u0915\u093E\u0930\u094D\u092F' },
  'feed.available': { en: 'Available', hi: '\u0909\u092A\u0932\u092C\u094D\u0927' },
  'feed.noActive': { en: 'No active tasks right now', hi: '\u0905\u092D\u0940 \u0915\u094B\u0908 \u0938\u0915\u094D\u0930\u093F\u092F \u0915\u093E\u0930\u094D\u092F \u0928\u0939\u0940\u0902' },
  'feed.noAvailable': { en: 'No new connections available right now', hi: '\u0905\u092D\u0940 \u0915\u094B\u0908 \u0928\u092F\u093E \u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902' },
  'feed.all': { en: 'All', hi: '\u0938\u092D\u0940' },
  'feed.install': { en: 'Install', hi: '\u0907\u0902\u0938\u094D\u091F\u0949\u0932' },
  'feed.restore': { en: 'Restore', hi: '\u0930\u093F\u0938\u094D\u091F\u094B\u0930' },
  'feed.netbox': { en: 'NetBox', hi: '\u0928\u0947\u091F\u092C\u0949\u0915\u094D\u0938' },
  'feed.hiddenCritical': { en: 'HIGH RESTORE task(s) hidden by filter', hi: '\u0939\u093E\u0908 \u0930\u093F\u0938\u094D\u091F\u094B\u0930 \u0915\u093E\u0930\u094D\u092F \u092B\u093F\u0932\u094D\u091F\u0930 \u0938\u0947 \u091B\u093F\u092A\u093E \u0939\u0941\u0906 \u0939\u0948' },
  'feed.resolved': { en: 'Resolved', hi: '\u0939\u0932 \u0939\u094B \u0917\u092F\u093E' },

  // ---- TaskCard CTAs ----
  'cta.claim': { en: 'Claim', hi: '\u0915\u094D\u0932\u0947\u092E \u0915\u0930\u0947\u0902' },
  'cta.accept': { en: 'Accept', hi: '\u0938\u094D\u0935\u0940\u0915\u093E\u0930 \u0915\u0930\u0947\u0902' },
  'cta.scheduleAssign': { en: 'Schedule / Assign', hi: '\u0936\u0947\u0921\u094D\u092F\u0942\u0932 / \u0905\u0938\u093E\u0907\u0928' },
  'cta.assign': { en: 'Assign', hi: '\u0905\u0938\u093E\u0907\u0928 \u0915\u0930\u0947\u0902' },
  'cta.markResolved': { en: 'Mark Resolved', hi: '\u0939\u0932 \u0915\u093F\u092F\u093E' },
  'cta.collected': { en: 'Collected', hi: '\u0915\u0932\u0947\u0915\u094D\u091F \u0915\u093F\u092F\u093E' },
  'cta.confirmReturn': { en: 'Confirm Return', hi: '\u0935\u093E\u092A\u0938\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902' },
  'cta.verifyManually': { en: 'Verify Manually', hi: '\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932 \u0938\u0924\u094D\u092F\u093E\u092A\u0928' },
  'cta.markInstalled': { en: 'Mark Installed', hi: '\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u093F\u092F\u093E' },
  'cta.resolveUrgent': { en: 'Resolve (Urgent)', hi: '\u0939\u0932 \u0915\u0930\u0947\u0902 (\u0924\u0941\u0930\u0902\u0924)' },
  'cta.view': { en: 'View', hi: '\u0926\u0947\u0916\u0947\u0902' },
  'cta.reassign': { en: 'Reassign', hi: '\u092A\u0941\u0928\u0903 \u0905\u0938\u093E\u0907\u0928' },
  'cta.resolve': { en: 'Resolve', hi: '\u0939\u0932 \u0915\u0930\u0947\u0902' },
  'cta.startWork': { en: 'Start Work', hi: '\u0915\u093E\u092E \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902' },
  'cta.install': { en: 'Mark Installed', hi: '\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u093F\u092F\u093E' },

  // ---- TaskCard labels ----
  'card.high': { en: 'HIGH', hi: '\u0909\u091A\u094D\u091A' },
  'card.overdue': { en: 'Overdue', hi: '\u0938\u092E\u092F \u092C\u0940\u0924\u093E' },
  'card.remaining': { en: 'remaining', hi: '\u0936\u0947\u0937' },
  'card.offerExpires': { en: 'Offer expires', hi: '\u0911\u092B\u0930 \u0938\u092E\u093E\u092A\u094D\u0924' },
  'card.claimExpiring': { en: 'Claim expiring', hi: '\u0915\u094D\u0932\u0947\u092E \u0938\u092E\u093E\u092A\u094D\u0924' },
  'card.highRestore': { en: 'High restore', hi: '\u0939\u093E\u0908 \u0930\u093F\u0938\u094D\u091F\u094B\u0930' },
  'card.left': { en: 'left', hi: '\u0936\u0947\u0937' },
  'card.restoreRetry': { en: 'Restore retry', hi: '\u0930\u093F\u0938\u094D\u091F\u094B\u0930 \u092A\u0941\u0928\u0903\u092A\u094D\u0930\u092F\u093E\u0938' },
  'card.attempt': { en: 'attempt', hi: '\u092A\u094D\u0930\u092F\u093E\u0938' },
  'card.blockedAction': { en: 'Blocked -- action needed', hi: '\u0930\u0941\u0915\u093E -- \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908 \u0906\u0935\u0936\u094D\u092F\u0915' },
  'card.returnOverdue': { en: 'Return overdue', hi: '\u0935\u093E\u092A\u0938\u0940 \u0938\u092E\u092F \u092C\u0940\u0924\u093E' },
  'card.verificationPending': { en: 'Verification pending -- confirm', hi: '\u0938\u0924\u094D\u092F\u093E\u092A\u0928 \u092C\u093E\u0915\u0940 -- \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902' },
  'card.installOverdue': { en: 'Install overdue', hi: '\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0938\u092E\u092F \u092C\u0940\u0924\u093E' },
  'card.pickupOverdue': { en: 'Pickup overdue', hi: '\u092A\u093F\u0915\u0905\u092A \u0938\u092E\u092F \u092C\u0940\u0924\u093E' },
  'card.assignmentUnaccepted': { en: 'Assignment unaccepted', hi: '\u0905\u0938\u093E\u0907\u0928\u092E\u0947\u0902\u091F \u0905\u0938\u094D\u0935\u0940\u0915\u0943\u0924' },
  'card.chainEscalation': { en: 'Chain escalation pending', hi: '\u091A\u0947\u0928 \u090F\u0938\u094D\u0915\u0947\u0932\u0947\u0936\u0928 \u092C\u093E\u0915\u0940' },
  'card.manualException': { en: 'Manual exception', hi: '\u092E\u0948\u0928\u094D\u092F\u0941\u0905\u0932 \u0905\u092A\u0935\u093E\u0926' },

  // ---- SecondaryMenu ----
  'menu.title': { en: 'Menu', hi: '\u092E\u0947\u0928\u094D\u092F\u0942' },
  'menu.wallet': { en: 'Wallet', hi: '\u0935\u0949\u0932\u0947\u091F' },
  'menu.walletDesc': { en: 'Balance & transactions', hi: '\u092C\u0948\u0932\u0947\u0902\u0938 \u0914\u0930 \u0932\u0947\u0928\u0926\u0947\u0928' },
  'menu.team': { en: 'Team', hi: '\u091F\u0940\u092E' },
  'menu.teamDesc': { en: 'Manage technicians', hi: '\u091F\u0947\u0915\u094D\u0928\u0940\u0936\u093F\u092F\u0928 \u092A\u094D\u0930\u092C\u0902\u0927\u0928' },
  'menu.netbox': { en: 'NetBox', hi: '\u0928\u0947\u091F\u092C\u0949\u0915\u094D\u0938' },
  'menu.netboxDesc': { en: 'Orders & inventory', hi: '\u0911\u0930\u094D\u0921\u0930 \u0914\u0930 \u0907\u0902\u0935\u0947\u0902\u091F\u094D\u0930\u0940' },
  'menu.support': { en: 'Support', hi: '\u0938\u092A\u094B\u0930\u094D\u091F' },
  'menu.supportDesc': { en: 'Cases & escalation', hi: '\u0915\u0947\u0938 \u0914\u0930 \u090F\u0938\u094D\u0915\u0947\u0932\u0947\u0936\u0928' },
  'menu.policies': { en: 'Policies & Updates', hi: '\u0928\u0940\u0924\u093F\u092F\u093E\u0901 \u0914\u0930 \u0905\u092A\u0921\u0947\u091F' },
  'menu.policiesDesc': { en: 'Documents & changelog', hi: '\u0926\u0938\u094D\u0924\u093E\u0935\u0947\u095B \u0914\u0930 \u092C\u0926\u0932\u093E\u0935 \u0932\u0949\u0917' },
  'menu.profile': { en: 'Profile & Settings', hi: '\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u0914\u0930 \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938' },
  'menu.profileDesc': { en: 'Account & preferences', hi: '\u0916\u093E\u0924\u093E \u0914\u0930 \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915\u0924\u093E\u090F\u0901' },

  // ---- ProfilePage ----
  'profile.title': { en: 'Profile', hi: '\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932' },
  'profile.language': { en: 'Language', hi: '\u092D\u093E\u0937\u093E' },
  'profile.notifications': { en: 'Notification Settings', hi: '\u0938\u0942\u091A\u0928\u093E \u0938\u0947\u091F\u093F\u0902\u0917\u094D\u0938' },
  'profile.taskAlerts': { en: 'Task Alerts', hi: '\u0915\u093E\u0930\u094D\u092F \u0938\u0942\u091A\u0928\u093E' },
  'profile.slaWarnings': { en: 'SLA Warnings', hi: 'SLA \u091A\u0947\u0924\u093E\u0935\u0928\u0940' },
  'profile.settlementUpdates': { en: 'Settlement Updates', hi: '\u0938\u0947\u091F\u0932\u092E\u0947\u0902\u091F \u0905\u092A\u0921\u0947\u091F' },
  'profile.accountInfo': { en: 'Account Information', hi: '\u0916\u093E\u0924\u093E \u091C\u093E\u0928\u0915\u093E\u0930\u0940' },
  'profile.cspId': { en: 'CSP ID', hi: 'CSP \u0906\u0908\u0921\u0940' },
  'profile.zone': { en: 'Zone', hi: '\u095B\u094B\u0928' },
  'profile.partnerSince': { en: 'Partner Since', hi: '\u092A\u093E\u0930\u094D\u091F\u0928\u0930 \u0924\u093F\u0925\u093F' },
  'profile.email': { en: 'Email', hi: '\u0908\u092E\u0947\u0932' },
  'profile.phone': { en: 'Phone', hi: '\u092B\u094B\u0928' },
  'profile.bandPartner': { en: 'Band A Partner', hi: '\u092C\u0948\u0902\u0921 A \u092A\u093E\u0930\u094D\u091F\u0928\u0930' },
  'profile.back': { en: 'Back', hi: '\u0935\u093E\u092A\u0938' },

  // ---- Capability Reset Banner ----
  'capabilityReset.title': { en: 'Capability Reset Active', hi: '\u0915\u094D\u0937\u092E\u0924\u093E \u0930\u0940\u0938\u0947\u091F \u0938\u0915\u094D\u0930\u093F\u092F' },
  'capabilityReset.desc': {
    en: 'Task assignments may be paused. Complete retraining to restore full partner status. Contact your zone manager.',
    hi: '\u0915\u093E\u0930\u094D\u092F \u0906\u0935\u0902\u091F\u0928 \u0930\u0941\u0915 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964 \u092A\u0942\u0930\u094D\u0923 \u092A\u093E\u0930\u094D\u091F\u0928\u0930 \u0938\u094D\u0925\u093F\u0924\u093F \u092C\u0939\u093E\u0932 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092A\u0941\u0928\u0930\u094D\u092A\u094D\u0930\u0936\u093F\u0915\u094D\u0937\u0923 \u092A\u0942\u0930\u093E \u0915\u0930\u0947\u0902\u0964 \u0905\u092A\u0928\u0947 \u095B\u094B\u0928 \u092E\u0948\u0928\u0947\u091C\u0930 \u0938\u0947 \u0938\u0902\u092A\u0930\u094D\u0915 \u0915\u0930\u0947\u0902\u0964',
  },

  // ---- Wallet Frozen ----
  'walletFrozen.title': { en: 'Wallet Frozen', hi: '\u0935\u0949\u0932\u0947\u091F \u092B\u094D\u0930\u0940\u095B' },
  'walletFrozen.desc': {
    en: 'Withdrawals are disabled. Settlements will accumulate but cannot be withdrawn until the investigation is resolved.',
    hi: '\u0928\u093F\u0915\u093E\u0938\u0940 \u0905\u0915\u094D\u0937\u092E \u0939\u0948\u0964 \u0938\u0947\u091F\u0932\u092E\u0947\u0902\u091F \u091C\u092E\u093E \u0939\u094B\u0924\u0947 \u0930\u0939\u0947\u0902\u0917\u0947 \u0932\u0947\u0915\u093F\u0928 \u091C\u093E\u0902\u091A \u092A\u0942\u0930\u0940 \u0939\u094B\u0928\u0947 \u0924\u0915 \u0928\u093F\u0915\u093E\u0932\u0947 \u0928\u0939\u0940\u0902 \u091C\u093E \u0938\u0915\u0924\u0947\u0964',
  },

  // ---- Profile: Offer Notifications ----
  'profile.offerNotifications': { en: 'Offer Notifications', hi: '\u0911\u092B\u0930 \u0938\u0942\u091A\u0928\u093E' },
  'profile.offerToggleConsequence': {
    en: 'You will not receive new connection offers. Your active base will not grow until you turn this back on.',
    hi: '\u0906\u092A\u0915\u094B \u0928\u090F \u0915\u0928\u0947\u0915\u094D\u0936\u0928 \u0911\u092B\u0930 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0947\u0902\u0917\u0947\u0964 \u091C\u092C \u0924\u0915 \u0906\u092A \u0907\u0938\u0947 \u0935\u093E\u092A\u0938 \u091A\u093E\u0932\u0942 \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u0947, \u0906\u092A\u0915\u093E \u0938\u0915\u094D\u0930\u093F\u092F \u092C\u0947\u0938 \u0928\u0939\u0940\u0902 \u092C\u0922\u093C\u0947\u0917\u093E\u0964',
  },

  // ---- Home page ----
  'home.offerNotifications': { en: 'Offer notifications:', hi: '\u0911\u092B\u0930 \u0938\u0942\u091A\u0928\u093E:' },
  'home.on': { en: 'ON', hi: '\u091A\u093E\u0932\u0942' },
  'home.off': { en: 'OFF', hi: '\u092C\u0902\u0926' },

  // ---- Technician App ----
  'tech.appTitle': { en: 'Wiom Technician', hi: 'Wiom \u091F\u0947\u0915\u094D\u0928\u0940\u0936\u093F\u092F\u0928' },
  'tech.selectProfile': { en: 'Select your profile to continue', hi: '\u091C\u093E\u0930\u0940 \u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0905\u092A\u0928\u0940 \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u091A\u0941\u0928\u0947\u0902' },
  'tech.onlyCSP': { en: 'Only technicians added by your CSP can log in.', hi: '\u0915\u0947\u0935\u0932 \u0906\u092A\u0915\u0947 CSP \u0926\u094D\u0935\u093E\u0930\u093E \u091C\u094B\u0921\u093C\u0947 \u0917\u090F \u091F\u0947\u0915\u094D\u0928\u0940\u0936\u093F\u092F\u0928 \u0932\u0949\u0917\u0907\u0928 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964' },
  'tech.activeTasks': { en: 'Active Tasks', hi: '\u0938\u0915\u094D\u0930\u093F\u092F \u0915\u093E\u0930\u094D\u092F' },
  'tech.completed': { en: 'Completed', hi: '\u092A\u0942\u0930\u094D\u0923' },
  'tech.noActive': { en: 'No active tasks right now', hi: '\u0905\u092D\u0940 \u0915\u094B\u0908 \u0938\u0915\u094D\u0930\u093F\u092F \u0915\u093E\u0930\u094D\u092F \u0928\u0939\u0940\u0902' },
  'tech.available': { en: 'Available', hi: '\u0909\u092A\u0932\u092C\u094D\u0927' },
  'tech.unavailable': { en: 'Unavailable', hi: '\u0905\u0928\u0941\u092A\u0932\u092C\u094D\u0927' },
  'tech.profile': { en: 'Profile', hi: '\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932' },
  'tech.stats': { en: 'Stats', hi: '\u0906\u0901\u0915\u0921\u093C\u0947' },
  'tech.logout': { en: 'Logout', hi: '\u0932\u0949\u0917\u0906\u0909\u091F' },
  'tech.accept': { en: 'Accept Assignment', hi: '\u0905\u0938\u093E\u0907\u0928\u092E\u0947\u0902\u091F \u0938\u094D\u0935\u0940\u0915\u093E\u0930 \u0915\u0930\u0947\u0902' },
  'tech.startWork': { en: 'Start Work', hi: '\u0915\u093E\u092E \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902' },
  'tech.markInstalled': { en: 'Mark Installed', hi: '\u0907\u0902\u0938\u094D\u091F\u0949\u0932 \u0915\u093F\u092F\u093E' },
  'tech.resolve': { en: 'Resolve', hi: '\u0939\u0932 \u0915\u0930\u0947\u0902' },
  'tech.markCollected': { en: 'Mark Collected', hi: '\u0915\u0932\u0947\u0915\u094D\u091F \u0915\u093F\u092F\u093E' },
  'tech.confirmReturn': { en: 'Confirm Return', hi: '\u0935\u093E\u092A\u0938\u0940 \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902' },
  'tech.timeline': { en: 'Timeline', hi: '\u0938\u092E\u092F\u0930\u0947\u0916\u093E' },
  'tech.back': { en: 'Back', hi: '\u0935\u093E\u092A\u0938' },

  // ---- Support Confirmation ----
  'support.receiptTitle': { en: 'Case Submitted', hi: '\u0915\u0947\u0938 \u0938\u092C\u092E\u093F\u091F \u0939\u094B \u0917\u092F\u093E' },
  'support.receiptDesc': {
    en: 'Your support case has been submitted. Expect a response within 24 hours.',
    hi: '\u0906\u092A\u0915\u093E \u0938\u092A\u094B\u0930\u094D\u091F \u0915\u0947\u0938 \u0938\u092C\u092E\u093F\u091F \u0939\u094B \u0917\u092F\u093E \u0939\u0948\u0964 24 \u0918\u0902\u091F\u0947 \u0915\u0947 \u0905\u0902\u0926\u0930 \u091C\u0935\u093E\u092C \u0915\u0940 \u0909\u092E\u094D\u092E\u0940\u0926 \u0915\u0930\u0947\u0902\u0964',
  },
  'support.backToSupport': { en: 'Back to Support', hi: '\u0938\u092A\u094B\u0930\u094D\u091F \u092A\u0930 \u0935\u093E\u092A\u0938' },

  // ---- Consequence Label ----
  'consequence.label': { en: 'What this means:', hi: '\u0907\u0938\u0915\u093E \u092E\u0924\u0932\u092C:' },

  // ---- Lifetime Earnings ----
  'assurance.lifetimeEarned': { en: 'Lifetime Earned', hi: '\u0915\u0941\u0932 \u0915\u092E\u093E\u0908' },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('wiom_lang') as Lang) || 'en';
    }
    return 'en';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wiom_lang', newLang);
    }
  }, []);

  // Set data-lang on <html> for Hindi typography boost
  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry['en'] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
