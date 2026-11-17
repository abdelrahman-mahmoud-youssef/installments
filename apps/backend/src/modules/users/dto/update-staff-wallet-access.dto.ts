import { WalletAccess } from '@prisma/client';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsString, ValidateIf } from 'class-validator';
import { MAX_STAFF_WALLET_GRANTS } from '../../../common/constants';

export class UpdateStaffWalletAccessDto {
  @IsEnum(WalletAccess)
  walletAccess!: WalletAccess;

  @ValidateIf((dto: UpdateStaffWalletAccessDto) => dto.walletAccess === WalletAccess.SELECTED)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @ArrayMaxSize(MAX_STAFF_WALLET_GRANTS)
  @IsString({ each: true })
  paymentMethodIds: string[] = [];
}
