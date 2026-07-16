import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bots = sqliteTable('bots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', { enum: ['idle', 'running', 'done', 'error'] })
    .notNull()
    .default('idle'),
  lastRun: text('last_run'),
  scriptPath: text('script_path').notNull(),
});

export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  botId: text('bot_id')
    .references(() => bots.id)
    .notNull(),
  botName: text('bot_name').notNull(),
  status: text('status', { enum: ['idle', 'running', 'done', 'error'] })
    .notNull()
    .default('running'),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  triggeredBy: text('triggered_by').notNull().default(''),
  result: text('result'),
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  executionId: text('execution_id')
    .references(() => executions.id)
    .notNull(),
  level: text('level', { enum: ['info', 'success', 'warn', 'error'] }).notNull(),
  message: text('message').notNull(),
  timestamp: text('timestamp').notNull(),
});
