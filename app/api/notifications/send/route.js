import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { NotificationSchema, formatValidationError } from '../../../utils/validation';

// Configure web-push with VAPID details (only if valid env vars are set)
const VAPID_SUBJECT = process.env.VAPID_EMAIL || process.env.VAPID_SUBJECT;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Check if VAPID keys are valid (not placeholder values)
const isValidVapidConfig = 
  VAPID_SUBJECT && 
  VAPID_PUBLIC_KEY && 
  VAPID_PRIVATE_KEY &&
  VAPID_SUBJECT.startsWith('mailto:') &&
  VAPID_PUBLIC_KEY.length > 50 &&
  VAPID_PRIVATE_KEY.length > 30;

if (isValidVapidConfig) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.warn('Failed to set VAPID details:', e.message);
  }
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    // 1. 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 3. 입력값 검증 (Zod)
    const requestBody = await request.json();

    let validatedData;
    try {
      validatedData = NotificationSchema.parse(requestBody);
    } catch (validationError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: formatValidationError(validationError),
          details: validationError.errors
        },
        { status: 400 }
      );
    }

    const { userId, title, body, url, tag, requireInteraction } = validatedData;

    // Get user's push subscriptions from database
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found for user' },
        { status: 404 }
      );
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/',
      tag: tag || 'default',
      requireInteraction: requireInteraction || false,
      timestamp: new Date().toISOString()
    });

    // Send push notification to all user's subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('Error sending notification:', error);

        // If subscription is invalid (410 Gone), remove it from database
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }

        return { success: false, endpoint: subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successCount} of ${subscriptions.length} devices`,
      results
    });

  } catch (error) {
    console.error('Error in send notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/notifications/send
// {
//   "userId": "user-uuid",
//   "title": "Produk baru!",
//   "body": "Ada produk baru yang mungkin Anda sukai",
//   "url": "/products/123",
//   "tag": "new-product",
//   "requireInteraction": false
// }