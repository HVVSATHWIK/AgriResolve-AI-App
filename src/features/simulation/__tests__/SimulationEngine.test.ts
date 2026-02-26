import fc from 'fast-check';
import { SimulationEngine } from '../SimulationEngine';

// Model-based testing approach
type Model = {
    funds: number;
    health: number;
    waterLevel: number;
    nitrogenLevel: number;
    pestLevel: number;
    stage: string;
};

class WaterCommand implements fc.Command<Model, SimulationEngine> {
    check(_m: Model): boolean {
        return true; // Can always attempt to water
    }
    run(m: Model, r: SimulationEngine): void {
        const prevFunds = r.getState().funds;
        r.performAction('WATER');
        const state = r.getState();

        if (m.stage === 'DEAD') {
            expect(state).toEqual(expect.objectContaining({ stage: 'DEAD' }));
            return;
        }

        if (prevFunds < 10) {
            // Should fail silently or log error, but funds shouldn't change
            expect(state.funds).toBe(prevFunds);
        } else {
            expect(state.funds).toBe(prevFunds - 10);
            expect(state.waterLevel).toBeLessThanOrEqual(100);
            expect(state.waterLevel).toBeGreaterThanOrEqual(0);
        }
    }
    toString = () => 'WATER';
}

class FertilizeCommand implements fc.Command<Model, SimulationEngine> {
    check(_m: Model): boolean {
        return true;
    }
    run(m: Model, r: SimulationEngine): void {
        const prevFunds = r.getState().funds;
        r.performAction('FERTILIZE');
        const state = r.getState();

        if (m.stage === 'DEAD') return;

        if (prevFunds < 50) {
            expect(state.funds).toBe(prevFunds);
        } else {
            expect(state.funds).toBe(prevFunds - 50);
            expect(state.nitrogenLevel).toBeLessThanOrEqual(100);
        }
    }
    toString = () => 'FERTILIZE';
}

class PesticideCommand implements fc.Command<Model, SimulationEngine> {
    check(_m: Model): boolean {
        return true;
    }
    run(m: Model, r: SimulationEngine): void {
        const prevFunds = r.getState().funds;
        r.performAction('PESTICIDE');
        const state = r.getState();

        if (m.stage === 'DEAD') return;

        if (prevFunds < 100) {
            expect(state.funds).toBe(prevFunds);
        } else {
            expect(state.funds).toBe(prevFunds - 100);
            expect(state.pestLevel).toBeGreaterThanOrEqual(0);
        }
    }
    toString = () => 'PESTICIDE';
}

class NextDayCommand implements fc.Command<Model, SimulationEngine> {
    check(_m: Model): boolean {
        return true;
    }
    run(m: Model, r: SimulationEngine): void {
        const prevDay = r.getState().day;
        r.performAction('NEXT_DAY');
        const state = r.getState();

        if (m.stage === 'DEAD') return;

        expect(state.day).toBe(prevDay + 1);

        // Invariants
        expect(state.health).toBeLessThanOrEqual(100);
        expect(state.health).toBeGreaterThanOrEqual(0);

        // We can't strictly test health > 0 here because it might naturally die, 
        // but we can check that *if* it was alive and health drops <=0, stage becomes DEAD
        if (state.health <= 0) {
            expect(state.stage).toBe('DEAD');
        }

        expect(state.waterLevel).toBeLessThanOrEqual(100);
        expect(state.waterLevel).toBeGreaterThanOrEqual(0);
        expect(state.nitrogenLevel).toBeGreaterThanOrEqual(0);
    }
    toString = () => 'NEXT_DAY';
}

describe('SimulationEngine Properties', () => {
    it('should maintain invariants across random action sequences', () => {
        const allCommands = [
            fc.constant(new WaterCommand()),
            fc.constant(new FertilizeCommand()),
            fc.constant(new PesticideCommand()),
            fc.constant(new NextDayCommand())
        ];

        fc.assert(
            fc.property(fc.commands(allCommands, { maxCommands: 50 }), (cmds) => {
                const engine = new SimulationEngine();
                const model: Model = {
                    funds: 1000,
                    health: 100,
                    waterLevel: 50,
                    nitrogenLevel: 50,
                    pestLevel: 0,
                    stage: 'SEED'
                };

                fc.modelRun(() => ({
                    model: model, // Not truly tracking state here, just using commands to drive implementation
                    real: engine
                }), cmds);
            }),
            { numRuns: 2005 } // Specific request > 2000
        );
    });
});
