import 'cypress-real-events';
import { addCompareSnapshotCommand } from 'cypress-visual-regression/dist/command';
addCompareSnapshotCommand({
    errorThreshold: 0.1,
});
