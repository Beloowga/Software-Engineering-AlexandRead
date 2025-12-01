import { supabase } from '../db.js';

const ACCOUNT_TABLE = process.env.SUPABASE_ACCOUNT_TABLE || 'account';
const PLAN_PRICE = Number(process.env.SUBSCRIPTION_PRICE || 4.99);
const PLAN_DURATION_DAYS = Number(process.env.SUBSCRIPTION_DURATION_DAYS || 30);

function toDateOnly(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isActiveSubscription(row) {
  if (!row?.end_sub_date) return false;
  const endDate = new Date(row.end_sub_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate >= today;
}

function buildSubscriptionResponse(row) {
  if (!row) {
    return {
      isActive: false,
      value: PLAN_PRICE,
      start: null,
      end: null,
      autoRenew: false,
      daysRemaining: 0,
    };
  }
  const endDate = row.end_sub_date ? new Date(row.end_sub_date) : null;
  const today = new Date();
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  return {
    isActive: isActiveSubscription(row),
    value: row.sub_value ?? PLAN_PRICE,
    start: row.start_sub_date ?? null,
    end: row.end_sub_date ?? null,
    autoRenew: Boolean(row.auto_renew),
    daysRemaining,
  };
}

async function renewIfNeeded(userId, profileRow) {
  if (!profileRow?.auto_renew) return profileRow;

  const active = isActiveSubscription(profileRow);
  if (active) return profileRow;

  const startDate = new Date();
  const endDate = addDays(startDate, PLAN_DURATION_DAYS);

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .update({
      sub_value: profileRow.sub_value ?? PLAN_PRICE,
      start_sub_date: toDateOnly(startDate),
      end_sub_date: toDateOnly(endDate),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('[subscriptionController] auto-renew update failed:', error);
    return profileRow;
  }

  return data;
}

export async function getSubscription(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select('sub_value,start_sub_date,end_sub_date,auto_renew')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[subscriptionController] getSubscription error:', error);
    return res.status(500).json({ error: 'Unable to load subscription.' });
  }

  const refreshed = await renewIfNeeded(userId, data);
  return res.json({ subscription: buildSubscriptionResponse(refreshed) });
}

export async function startSubscription(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const startDate = new Date();
  const endDate = addDays(startDate, PLAN_DURATION_DAYS);
  const autoRenew = typeof req.body?.autoRenew === 'boolean' ? req.body.autoRenew : true;

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .update({
      sub_value: PLAN_PRICE,
      start_sub_date: toDateOnly(startDate),
      end_sub_date: toDateOnly(endDate),
      auto_renew: autoRenew,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('[subscriptionController] startSubscription error:', error);
    return res.status(500).json({ error: 'Unable to start subscription.' });
  }

  return res.status(201).json({ subscription: buildSubscriptionResponse(data) });
}

export async function updateAutoRenew(req, res) {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const autoRenew = Boolean(req.body?.autoRenew);

  const { data, error } = await supabase
    .from(ACCOUNT_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[subscriptionController] updateAutoRenew fetch error:', error);
    return res.status(500).json({ error: 'Unable to load subscription.' });
  }

  if (!data) {
    return res.status(404).json({ error: 'Profile not found.' });
  }

  let startDate = data.start_sub_date;
  let endDate = data.end_sub_date;

  if (autoRenew && !isActiveSubscription(data)) {
    const now = new Date();
    startDate = toDateOnly(now);
    endDate = toDateOnly(addDays(now, PLAN_DURATION_DAYS));
  }

  const { data: updated, error: updateError } = await supabase
    .from(ACCOUNT_TABLE)
    .update({
      auto_renew: autoRenew,
      start_sub_date: startDate,
      end_sub_date: endDate,
      sub_value: data.sub_value ?? PLAN_PRICE,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (updateError) {
    console.error('[subscriptionController] updateAutoRenew error:', updateError);
    return res.status(500).json({ error: 'Unable to update auto-renew.' });
  }

  return res.json({ subscription: buildSubscriptionResponse(updated) });
}
