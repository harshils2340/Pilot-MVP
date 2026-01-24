import mongoose, { Schema, Document } from 'mongoose';

export interface IPipelineStage extends Document {
  name: string;
  sequence: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineStageSchema = new Schema<IPipelineStage>(
  {
    name: { type: String, required: true },
    sequence: { type: Number, required: true, default: 0 },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    isWon: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PipelineStageSchema.index({ sequence: 1 });

export const PipelineStage = mongoose.models?.PipelineStage ?? mongoose.model<IPipelineStage>('PipelineStage', PipelineStageSchema);

const defaultStages = [
  { name: 'New', sequence: 0, probability: 10, isWon: false, isLost: false },
  { name: 'Qualified', sequence: 1, probability: 30, isWon: false, isLost: false },
  { name: 'Proposal', sequence: 2, probability: 50, isWon: false, isLost: false },
  { name: 'Negotiation', sequence: 3, probability: 70, isWon: false, isLost: false },
  { name: 'Won', sequence: 4, probability: 100, isWon: true, isLost: false },
  { name: 'Lost', sequence: 5, probability: 0, isWon: false, isLost: true },
];

export async function initializeDefaultStages() {
  const count = await PipelineStage.countDocuments();
  if (count === 0) {
    await PipelineStage.insertMany(defaultStages);
  }
}
