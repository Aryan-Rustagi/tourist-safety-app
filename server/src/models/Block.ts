import mongoose, { Document, Schema } from 'mongoose';

export interface IBlock extends Document {
  index: number;
  timestamp: string;
  data: Record<string, any>;
  previousHash: string;
  hash: string;
  createdAt: Date;
}

const BlockSchema: Schema<IBlock> = new Schema(
  {
    index: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    previousHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Block = mongoose.model<IBlock>('Block', BlockSchema);
