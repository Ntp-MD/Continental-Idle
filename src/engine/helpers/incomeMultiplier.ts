import { getTotalIncomeMult } from '../skillManager'
import { getRoyalIncomeMult, getSovereignBuffMult } from '../royalManager'
import { sovereignManager } from '../sovereignManager'

/**
 * Combined income multiplier chain shared across income calculations:
 * commerce skill tree × royal skill tree × sovereign buff × active decree.
 */
export function getTotalIncomeMultiplier(): number {
	return getTotalIncomeMult() * getRoyalIncomeMult() * getSovereignBuffMult() * (1 + sovereignManager.getActiveDecreeMult('incomeMultiplier'))
}
