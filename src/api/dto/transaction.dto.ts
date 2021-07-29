/* tslint:disable:variable-name */
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionState } from '../enums/transaction-state.enum';
import { IsBoolean, IsDate, IsEnum, IsNumber, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransactionDto {
  @IsUUID()
  id: string;
  @IsEnum(TransactionType)
  kind: TransactionType;
  @IsEnum(TransactionState)
  status: TransactionState;
  @IsNumber()
  @IsOptional()
  status_eta?: number;
  @IsString()
  @IsOptional()
  more_info_url?: string;
  @IsNumberString()
  @IsOptional()
  amount_in?: string;
  @IsNumberString()
  @IsOptional()
  amount_out?: string;
  @IsNumberString()
  @IsOptional()
  amount_fee?: string;
  @IsString()
  @IsOptional()
  from?: string;
  @IsString()
  @IsOptional()
  to?: string;
  // external_extra?: string;
  // external_extra_text?: string;
  @IsString()
  @IsOptional()
  deposit_memo?: string;
  @IsString()
  @IsOptional()
  deposit_memo_type?: string;
  withdraw_anchor_account?: string;
  withdraw_memo?: string;
  withdraw_memo_type?: string;
  @IsDate()
  @IsOptional()
  started_at?: Date;
  @IsDate()
  @IsOptional()
  completed_at?: Date;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
  @IsString()
  @IsOptional()
  message?: string;
  @IsBoolean()
  @IsOptional()
  refunded?: boolean;
}
