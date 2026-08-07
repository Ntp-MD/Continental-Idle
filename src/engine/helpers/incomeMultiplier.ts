import { getTotalIncomeMult } from '../skillManager'
import { getRoyalIncomeMult, getSovereignBuffMult } from '../royalManager'
import { sovereignManager } from '../sovereignManager'


export function getTotalIncomeMultiplier(): number {
	return getTotalIncomeMult() * getRoyalIncomeMult() * getSovereignBuffMult() * (1 + sovereignManager.getActiveDecreeMult('incomeMultiplier'))
}
