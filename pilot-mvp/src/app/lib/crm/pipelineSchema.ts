import mongoose, { Schema, Document } from 'mongoose';

/**
 * Odoo CRM Pipeline Stage Schema
 * Based on Odoo's crm.stage model
 * Reference: https://github.com/odoo/odoo/blob/master/addons/crm/models/crm_stage.py
 */

export interface IPipelineStage extends Document {
  name: string;
  sequence: number; // Order in pipeline (0 = first stage)
  probability: number; // Conversion probability (0-100)
  isWon: boolean; // Is this a "Won" stage?
  isLost: boolean; // Is this a "Lost" stage?
  teamId?: string; // Optional: restrict to specific team
  requirements?: string; // Requirements to move to next stage
  fold: boolean; // Fold in kanban view (Odoo pattern)
  createdAt: Date;
  updatedAt: Date;
}

const PipelineStageSchema: Schema<IPipelineStage> = new Schema(
  {
    name: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0 },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    isWon: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false },
    teamId: { type: String },
    requirements: { type: String },
    fold: { type: Boolean, default: false }, // Fold in kanban view
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
PipelineStageSchema.index({ sequence: 1 });
PipelineStageSchema.index({ teamId: 1 });

export const PipelineStage = mongoose.models.PipelineStage || mongoose.model<IPipelineStage>('PipelineStage', PipelineStageSchema);

/**
 * Initialize default pipeline stages (Odoo CRM pattern)
 */
export async function initializeDefaultStages() {
  const defaultStages = [
    { name: 'New', sequence: 0, probability: 10, isWon: false, isLost: false },
    { name: 'Qualified', sequence: 1, probability: 30, isWon: false, isLost: false },
    { name: 'Proposal', sequence: 2, probability: 50, isWon: false, isLost: false },
    { name: 'Negotiation', sequence: 3, probability: 70, isWon: false, isLost: false },
    { name: 'Won', sequence: 4, probability: 100, isWon: true, isLost: false },
    { name: 'Lost', sequence: 5, probability: 0, isWon: false, isLost: true },
  ];

  for (const stage of defaultStages) {
    await PipelineStage.findOneAndUpdate(
      { name: stage.name },
      stage,
      { upsert: true, new: true }
    );
  }
}
