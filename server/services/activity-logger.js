/**
 * Activity Logger Service
 * Automatically logs events to organization timeline
 */
import { getDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function logActivity({
  organizationId,
  entityId = null,
  userId,
  eventType,
  eventAction,
  eventTitle,
  eventDescription = '',
  metadata = {},
  referenceId = null,
  referenceType = null
}) {
  const db = getDb();

  const activity = {
    id: `evt_${uuidv4()}`,
    organization_id: organizationId,
    entity_id: entityId,
    user_id: userId,
    event_type: eventType,
    event_action: eventAction,
    event_title: eventTitle,
    event_description: eventDescription,
    metadata: JSON.stringify(metadata),
    reference_id: referenceId,
    reference_type: referenceType,
    created_at: Date.now()
  };

  db.prepare(`
    INSERT INTO activity_log (
      id, organization_id, entity_id, user_id, event_type, event_action,
      event_title, event_description, metadata, reference_id, reference_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    activity.id,
    activity.organization_id,
    activity.entity_id,
    activity.user_id,
    activity.event_type,
    activity.event_action,
    activity.event_title,
    activity.event_description,
    activity.metadata,
    activity.reference_id,
    activity.reference_type,
    activity.created_at
  );

  console.log(`[Activity Log] ${eventType}: ${eventTitle}`);
  return activity;
}
