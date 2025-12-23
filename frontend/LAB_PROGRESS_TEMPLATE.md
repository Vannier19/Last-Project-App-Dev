// Template Code untuk Tambahkan Lab Progress Tracking
// Copy code ini ke simulation components lain

// ========================================
// 1. ADD IMPORTS (di bagian paling atas)
// ========================================

import { Alert } from 'react-native';  // Tambah Alert jika belum ada
import { api } from '@/services/api';  // Tambah import api

// ========================================
// 2. ADD STATE (di dalam component function)
// ========================================

const [completedRuns, setCompletedRuns] = useState(0);

// ========================================
// 3. ADD useEffect (setelah state declarations)
// ========================================

// Mark lab as in-progress on first load
useEffect(() => {
    const markInProgress = async () => {
        try {
            // GANTI 'LAB_ID' sesuai simulasi:
            // 'glb-lab', 'glbb-lab', 'vertical-lab', 'projectile-lab'
            await api.updateLabStatus('LAB_ID', 'in-progress');
            console.log('✅ Lab marked as in-progress');
        } catch (error) {
            console.log('Failed to mark lab progress:', error);
        }
    };
    
    if (completedRuns === 0) {
        markInProgress();
    }
}, []);

// ========================================
// 4. UPDATE handleFinish() atau completion logic
// ========================================

const handleFinish = async () => {
    // ... kode existing untuk finish simulation ...
    
    // Tambahkan tracking:
    const newCompletedRuns = completedRuns + 1;
    setCompletedRuns(newCompletedRuns);

    // After 3 successful runs, mark lab as completed
    if (newCompletedRuns >= 3) {
        try {
            // GANTI 'LAB_ID' dan 'Lab Name' sesuai simulasi
            await api.updateLabStatus('LAB_ID', 'completed');
            Alert.alert(
                'Lab Completed! 🎉',
                'You have successfully completed the [Lab Name] simulation lab.',
                [{ text: 'OK' }]
            );
            console.log('✅ Lab marked as completed');
        } catch (error) {
            console.log('Failed to save lab completion:', error);
        }
    }
};

// ========================================
// EXAMPLE: GLBBSimulation.tsx
// ========================================

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { api } from '@/services/api';

export function GLBBSimulation() {
    // ... existing states ...
    const [completedRuns, setCompletedRuns] = useState(0);

    useEffect(() => {
        const markInProgress = async () => {
            try {
                await api.updateLabStatus('glbb-lab', 'in-progress');
                console.log('✅ GLBB Lab marked as in-progress');
            } catch (error) {
                console.log('Failed to mark lab progress:', error);
            }
        };
        
        if (completedRuns === 0) {
            markInProgress();
        }
    }, []);

    const handleFinish = async () => {
        // ... existing finish logic ...
        
        const newCompletedRuns = completedRuns + 1;
        setCompletedRuns(newCompletedRuns);

        if (newCompletedRuns >= 3) {
            try {
                await api.updateLabStatus('glbb-lab', 'completed');
                Alert.alert(
                    'Lab Completed! 🎉',
                    'You have successfully completed the GLBB simulation lab.',
                    [{ text: 'OK' }]
                );
                console.log('✅ GLBB Lab marked as completed');
            } catch (error) {
                console.log('Failed to save lab completion:', error);
            }
        }
    };

    // ... rest of component ...
}

// ========================================
// EXAMPLE: VerticalMotionSimulation.tsx
// ========================================

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { api } from '@/services/api';

export function VerticalMotionSimulation() {
    const [completedRuns, setCompletedRuns] = useState(0);

    useEffect(() => {
        const markInProgress = async () => {
            try {
                await api.updateLabStatus('vertical-lab', 'in-progress');
                console.log('✅ Vertical Motion Lab marked as in-progress');
            } catch (error) {
                console.log('Failed to mark lab progress:', error);
            }
        };
        
        if (completedRuns === 0) {
            markInProgress();
        }
    }, []);

    const handleFinish = async () => {
        const newCompletedRuns = completedRuns + 1;
        setCompletedRuns(newCompletedRuns);

        if (newCompletedRuns >= 3) {
            try {
                await api.updateLabStatus('vertical-lab', 'completed');
                Alert.alert(
                    'Lab Completed! 🎉',
                    'You have successfully completed the Vertical Motion simulation lab.',
                    [{ text: 'OK' }]
                );
                console.log('✅ Vertical Motion Lab marked as completed');
            } catch (error) {
                console.log('Failed to save lab completion:', error);
            }
        }
    };
}

// ========================================
// EXAMPLE: ProjectileMotionSimulation.tsx
// ========================================

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { api } from '@/services/api';

export function ProjectileMotionSimulation() {
    const [completedRuns, setCompletedRuns] = useState(0);

    useEffect(() => {
        const markInProgress = async () => {
            try {
                await api.updateLabStatus('projectile-lab', 'in-progress');
                console.log('✅ Projectile Motion Lab marked as in-progress');
            } catch (error) {
                console.log('Failed to mark lab progress:', error);
            }
        };
        
        if (completedRuns === 0) {
            markInProgress();
        }
    }, []);

    const handleFinish = async () => {
        const newCompletedRuns = completedRuns + 1;
        setCompletedRuns(newCompletedRuns);

        if (newCompletedRuns >= 3) {
            try {
                await api.updateLabStatus('projectile-lab', 'completed');
                Alert.alert(
                    'Lab Completed! 🎉',
                    'You have successfully completed the Projectile Motion simulation lab.',
                    [{ text: 'OK' }]
                );
                console.log('✅ Projectile Motion Lab marked as completed');
            } catch (error) {
                console.log('Failed to save lab completion:', error);
            }
        }
    };
}

// ========================================
// LAB ID REFERENCE
// ========================================
/*
'glb-lab'        - GLB Simulation (Uniform Linear Motion)
'glbb-lab'       - GLBB Simulation (Accelerated Motion)
'vertical-lab'   - Vertical Motion Simulation
'projectile-lab' - Projectile Motion Simulation
*/

// ========================================
// CUSTOMIZATION OPTIONS
// ========================================

// Option 1: Change completion requirement (default: 3 runs)
if (newCompletedRuns >= 5) { // Require 5 runs instead

// Option 2: Add progress indicator in UI
<Text>Runs completed: {completedRuns}/3</Text>

// Option 3: Different completion criteria
if (newCompletedRuns >= 3 && someOtherCondition) {

// Option 4: Track more detailed metrics
const [metrics, setMetrics] = useState({
    runsCompleted: 0,
    totalTime: 0,
    parametersUsed: []
});
