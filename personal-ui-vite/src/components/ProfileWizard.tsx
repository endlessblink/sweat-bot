/**
 * ProfileWizard - Multi-step profile creation wizard
 * Guides users through setting up their complete fitness profile
 */

import React, { useState } from 'react';
import { designTokens } from '../design-system/tokens';

interface ProfileWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type WizardStep = 'health' | 'medical' | 'equipment' | 'preferences';

interface HealthStats {
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  body_fat_percentage?: number;
  resting_heart_rate?: number;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  activity_level?: 'sedentary' | 'lightly_active' | 'moderate' | 'very_active' | 'extremely_active';
  workout_frequency_per_week?: number;
  preferred_workout_duration_minutes?: number;
}

interface MedicalInfo {
  medical_conditions: string[];
  injuries: string[];
}

interface EquipmentData {
  available_equipment: Record<string, any>;
  equipment_preferences: Record<string, any>;
}

interface FitnessPreferences {
  fitness_goals: string[];
  preferred_workout_types: string[];
  avoid_exercises: string[];
  focus_areas: string[];
  time_constraints: Record<string, any>;
}

export const ProfileWizard: React.FC<ProfileWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('health');
  const [healthStats, setHealthStats] = useState<HealthStats>({});
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({ medical_conditions: [], injuries: [] });
  const [equipment, setEquipment] = useState<EquipmentData>({
    available_equipment: { bodyweight: true },
    equipment_preferences: {}
  });
  const [preferences, setPreferences] = useState<FitnessPreferences>({
    fitness_goals: [],
    preferred_workout_types: [],
    avoid_exercises: [],
    focus_areas: [],
    time_constraints: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: WizardStep[] = ['health', 'medical', 'equipment', 'preferences'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleHealthSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/profile/health-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(healthStats)
      });

      if (response.ok) {
        setCurrentStep('medical');
      } else {
        console.error('Failed to update health stats');
      }
    } catch (error) {
      console.error('Error updating health stats:', error);
    }
  };

  const handleMedicalSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/profile/medical-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(medicalInfo)
      });

      if (response.ok) {
        setCurrentStep('equipment');
      } else {
        console.error('Failed to update medical info');
      }
    } catch (error) {
      console.error('Error updating medical info:', error);
    }
  };

  const handleEquipmentSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/profile/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(equipment)
      });

      if (response.ok) {
        setCurrentStep('preferences');
      } else {
        console.error('Failed to update equipment');
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  };

  const handlePreferencesSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8000/api/v1/profile/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        onComplete();
      } else {
        console.error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'health':
        handleHealthSubmit();
        break;
      case 'medical':
        handleMedicalSubmit();
        break;
      case 'equipment':
        handleEquipmentSubmit();
        break;
      case 'preferences':
        handlePreferencesSubmit();
        break;
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(0, currentStepIndex - 1);
    setCurrentStep(steps[prevIndex]);
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: designTokens.spacing[6],
      backgroundColor: designTokens.colors.background.primary,
      borderRadius: designTokens.borderRadius.lg,
      direction: 'rtl'
    }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: designTokens.spacing[8] }}>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: designTokens.colors.background.secondary,
          borderRadius: designTokens.borderRadius.full,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: designTokens.colors.interactive.primary,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{
          marginTop: designTokens.spacing[2],
          fontSize: designTokens.typography.fontSize.sm,
          color: designTokens.colors.text.secondary,
          textAlign: 'center'
        }}>
          שלב {currentStepIndex + 1} מתוך {steps.length}
        </p>
      </div>

      {/* Step Content */}
      {currentStep === 'health' && (
        <HealthStatsStep
          data={healthStats}
          onChange={setHealthStats}
        />
      )}

      {currentStep === 'medical' && (
        <MedicalInfoStep
          data={medicalInfo}
          onChange={setMedicalInfo}
        />
      )}

      {currentStep === 'equipment' && (
        <EquipmentStep
          data={equipment}
          onChange={setEquipment}
        />
      )}

      {currentStep === 'preferences' && (
        <PreferencesStep
          data={preferences}
          onChange={setPreferences}
        />
      )}

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: designTokens.spacing[4],
        marginTop: designTokens.spacing[8],
        justifyContent: 'space-between'
      }}>
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          style={{
            padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
            backgroundColor: designTokens.colors.background.secondary,
            color: designTokens.colors.text.primary,
            border: 'none',
            borderRadius: designTokens.borderRadius.md,
            fontSize: designTokens.typography.fontSize.base,
            fontWeight: designTokens.typography.fontWeight.medium,
            cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStepIndex === 0 ? 0.5 : 1
          }}
        >
          חזור
        </button>

        <div style={{ display: 'flex', gap: designTokens.spacing[3] }}>
          {onSkip && (
            <button
              onClick={onSkip}
              style={{
                padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
                backgroundColor: 'transparent',
                color: designTokens.colors.text.secondary,
                border: `1px solid ${designTokens.colors.border.default}`,
                borderRadius: designTokens.borderRadius.md,
                fontSize: designTokens.typography.fontSize.base,
                cursor: 'pointer'
              }}
            >
              דלג
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            style={{
              padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
              backgroundColor: designTokens.colors.interactive.primary,
              color: designTokens.colors.text.inverse,
              border: 'none',
              borderRadius: designTokens.borderRadius.md,
              fontSize: designTokens.typography.fontSize.base,
              fontWeight: designTokens.typography.fontWeight.medium,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {currentStep === 'preferences' ? (isSubmitting ? 'שומר...' : 'סיום') : 'המשך'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Health Stats Step Component
const HealthStatsStep: React.FC<{
  data: HealthStats;
  onChange: (data: HealthStats) => void;
}> = ({ data, onChange }) => {
  return (
    <div style={{ direction: 'rtl' }}>
      <h2 style={{
        fontSize: designTokens.typography.fontSize['2xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        מידע בסיסי
      </h2>
      <p style={{
        fontSize: designTokens.typography.fontSize.base,
        color: designTokens.colors.text.secondary,
        marginBottom: designTokens.spacing[6]
      }}>
        עזור לנו להתאים את האימונים בצורה מושלמת עבורך
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[4] }}>
        <InputField
          label="גיל"
          type="number"
          value={data.age || ''}
          onChange={(e) => onChange({ ...data, age: parseInt(e.target.value) || undefined })}
          placeholder="למשל: 30"
        />

        <InputField
          label="משקל (ק״ג)"
          type="number"
          value={data.weight_kg || ''}
          onChange={(e) => onChange({ ...data, weight_kg: parseFloat(e.target.value) || undefined })}
          placeholder="למשל: 75"
        />

        <InputField
          label="גובה (ס״מ)"
          type="number"
          value={data.height_cm || ''}
          onChange={(e) => onChange({ ...data, height_cm: parseFloat(e.target.value) || undefined })}
          placeholder="למשל: 175"
        />

        <SelectField
          label="רמת כושר"
          value={data.fitness_level || ''}
          onChange={(e) => onChange({ ...data, fitness_level: e.target.value as any })}
          options={[
            { value: '', label: 'בחר...' },
            { value: 'beginner', label: 'מתחיל' },
            { value: 'intermediate', label: 'בינוני' },
            { value: 'advanced', label: 'מתקדם' }
          ]}
        />

        <SelectField
          label="רמת פעילות יומית"
          value={data.activity_level || ''}
          onChange={(e) => onChange({ ...data, activity_level: e.target.value as any })}
          options={[
            { value: '', label: 'בחר...' },
            { value: 'sedentary', label: 'ישיבה רוב היום' },
            { value: 'lightly_active', label: 'פעילות קלה' },
            { value: 'moderate', label: 'פעילות בינונית' },
            { value: 'very_active', label: 'פעיל מאוד' },
            { value: 'extremely_active', label: 'אתלטי' }
          ]}
        />

        <InputField
          label="כמה פעמים בשבוע תרצה להתאמן?"
          type="number"
          value={data.workout_frequency_per_week || ''}
          onChange={(e) => onChange({ ...data, workout_frequency_per_week: parseInt(e.target.value) || undefined })}
          placeholder="למשל: 3-5"
        />

        <InputField
          label="משך אימון מועדף (דקות)"
          type="number"
          value={data.preferred_workout_duration_minutes || ''}
          onChange={(e) => onChange({ ...data, preferred_workout_duration_minutes: parseInt(e.target.value) || undefined })}
          placeholder="למשל: 45"
        />
      </div>
    </div>
  );
};

// Medical Info Step Component
const MedicalInfoStep: React.FC<{
  data: MedicalInfo;
  onChange: (data: MedicalInfo) => void;
}> = ({ data, onChange }) => {
  const [newCondition, setNewCondition] = useState('');
  const [newInjury, setNewInjury] = useState('');

  const addCondition = () => {
    if (newCondition.trim()) {
      onChange({
        ...data,
        medical_conditions: [...data.medical_conditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const addInjury = () => {
    if (newInjury.trim()) {
      onChange({
        ...data,
        injuries: [...data.injuries, newInjury.trim()]
      });
      setNewInjury('');
    }
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h2 style={{
        fontSize: designTokens.typography.fontSize['2xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        מידע רפואי
      </h2>
      <p style={{
        fontSize: designTokens.typography.fontSize.base,
        color: designTokens.colors.text.secondary,
        marginBottom: designTokens.spacing[6]
      }}>
        מידע זה יעזור לנו להתאים אימונים בטוחים עבורך (אופציונלי)
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[6] }}>
        {/* Medical Conditions */}
        <div>
          <label style={{
            display: 'block',
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            color: designTokens.colors.text.primary,
            marginBottom: designTokens.spacing[2]
          }}>
            מצבים רפואיים
          </label>
          <div style={{ display: 'flex', gap: designTokens.spacing[2] }}>
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCondition()}
              placeholder="למשל: אסטמה, לחץ דם גבוה"
              style={{
                flex: 1,
                padding: designTokens.spacing[3],
                backgroundColor: designTokens.colors.background.secondary,
                border: `1px solid ${designTokens.colors.border.default}`,
                borderRadius: designTokens.borderRadius.md,
                fontSize: designTokens.typography.fontSize.base,
                color: designTokens.colors.text.primary
              }}
            />
            <button
              onClick={addCondition}
              style={{
                padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
                backgroundColor: designTokens.colors.interactive.primary,
                color: designTokens.colors.text.inverse,
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                cursor: 'pointer'
              }}
            >
              הוסף
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2], marginTop: designTokens.spacing[3] }}>
            {data.medical_conditions.map((condition, index) => (
              <span key={index} style={{
                padding: `${designTokens.spacing[1]} ${designTokens.spacing[3]}`,
                backgroundColor: designTokens.colors.semantic.info + '20',
                color: designTokens.colors.semantic.info,
                borderRadius: designTokens.borderRadius.full,
                fontSize: designTokens.typography.fontSize.sm,
                display: 'flex',
                alignItems: 'center',
                gap: designTokens.spacing[2]
              }}>
                {condition}
                <button
                  onClick={() => onChange({
                    ...data,
                    medical_conditions: data.medical_conditions.filter((_, i) => i !== index)
                  })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Injuries */}
        <div>
          <label style={{
            display: 'block',
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            color: designTokens.colors.text.primary,
            marginBottom: designTokens.spacing[2]
          }}>
            פציעות קודמות או נוכחיות
          </label>
          <div style={{ display: 'flex', gap: designTokens.spacing[2] }}>
            <input
              type="text"
              value={newInjury}
              onChange={(e) => setNewInjury(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInjury()}
              placeholder="למשל: פציעת ברך, כאב גב תחתון"
              style={{
                flex: 1,
                padding: designTokens.spacing[3],
                backgroundColor: designTokens.colors.background.secondary,
                border: `1px solid ${designTokens.colors.border.default}`,
                borderRadius: designTokens.borderRadius.md,
                fontSize: designTokens.typography.fontSize.base,
                color: designTokens.colors.text.primary
              }}
            />
            <button
              onClick={addInjury}
              style={{
                padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
                backgroundColor: designTokens.colors.interactive.primary,
                color: designTokens.colors.text.inverse,
                border: 'none',
                borderRadius: designTokens.borderRadius.md,
                cursor: 'pointer'
              }}
            >
              הוסף
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2], marginTop: designTokens.spacing[3] }}>
            {data.injuries.map((injury, index) => (
              <span key={index} style={{
                padding: `${designTokens.spacing[1]} ${designTokens.spacing[3]}`,
                backgroundColor: designTokens.colors.semantic.warning + '20',
                color: designTokens.colors.semantic.warning,
                borderRadius: designTokens.borderRadius.full,
                fontSize: designTokens.typography.fontSize.sm,
                display: 'flex',
                alignItems: 'center',
                gap: designTokens.spacing[2]
              }}>
                {injury}
                <button
                  onClick={() => onChange({
                    ...data,
                    injuries: data.injuries.filter((_, i) => i !== index)
                  })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Equipment Step Component
const EquipmentStep: React.FC<{
  data: EquipmentData;
  onChange: (data: EquipmentData) => void;
}> = ({ data, onChange }) => {
  const equipmentOptions = [
    { key: 'bodyweight', label: 'משקל גוף בלבד', icon: '🤸' },
    { key: 'dumbbells', label: 'משקולות יד', icon: '🏋️' },
    { key: 'resistance_bands', label: 'גומיות התנגדות', icon: '🎗️' },
    { key: 'pull_up_bar', label: 'מוט מתח', icon: '🔧' },
    { key: 'yoga_mat', label: 'מזרן יוגה', icon: '🧘' },
    { key: 'kettlebell', label: 'קטלבל', icon: '⚖️' },
    { key: 'jump_rope', label: 'חבל קפיצה', icon: '🪢' },
    { key: 'foam_roller', label: 'רולר', icon: '📜' }
  ];

  const toggleEquipment = (key: string) => {
    const newEquipment = {
      ...data.available_equipment,
      [key]: !data.available_equipment[key]
    };
    onChange({ ...data, available_equipment: newEquipment });
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h2 style={{
        fontSize: designTokens.typography.fontSize['2xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        ציוד זמין
      </h2>
      <p style={{
        fontSize: designTokens.typography.fontSize.base,
        color: designTokens.colors.text.secondary,
        marginBottom: designTokens.spacing[6]
      }}>
        בחר את הציוד שיש לך בבית או בחדר כושר
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: designTokens.spacing[3]
      }}>
        {equipmentOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => toggleEquipment(option.key)}
            style={{
              padding: designTokens.spacing[4],
              backgroundColor: data.available_equipment[option.key]
                ? designTokens.colors.interactive.primary + '20'
                : designTokens.colors.background.secondary,
              border: `2px solid ${
                data.available_equipment[option.key]
                  ? designTokens.colors.interactive.primary
                  : designTokens.colors.border.default
              }`,
              borderRadius: designTokens.borderRadius.lg,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: designTokens.spacing[2],
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '2rem' }}>{option.icon}</span>
            <span style={{
              fontSize: designTokens.typography.fontSize.sm,
              fontWeight: designTokens.typography.fontWeight.medium,
              color: designTokens.colors.text.primary,
              textAlign: 'center'
            }}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Preferences Step Component
const PreferencesStep: React.FC<{
  data: FitnessPreferences;
  onChange: (data: FitnessPreferences) => void;
}> = ({ data, onChange }) => {
  const goalOptions = [
    { value: 'weight_loss', label: 'ירידה במשקל' },
    { value: 'muscle_gain', label: 'בניית שריר' },
    { value: 'endurance', label: 'סיבולת' },
    { value: 'strength', label: 'כוח' },
    { value: 'flexibility', label: 'גמישות' },
    { value: 'general_fitness', label: 'כושר כללי' }
  ];

  const workoutTypeOptions = [
    { value: 'hiit', label: 'HIIT' },
    { value: 'strength', label: 'כוח' },
    { value: 'cardio', label: 'קרדיו' },
    { value: 'yoga', label: 'יוגה' },
    { value: 'pilates', label: 'פילאטיס' },
    { value: 'functional', label: 'פונקציונלי' }
  ];

  const focusAreaOptions = [
    { value: 'upper_body', label: 'גוף עליון' },
    { value: 'lower_body', label: 'גוף תחתון' },
    { value: 'core', label: 'ליבה' },
    { value: 'full_body', label: 'גוף מלא' }
  ];

  const toggleOption = (field: keyof FitnessPreferences, value: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    onChange({ ...data, [field]: newArray });
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h2 style={{
        fontSize: designTokens.typography.fontSize['2xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        העדפות אימון
      </h2>
      <p style={{
        fontSize: designTokens.typography.fontSize.base,
        color: designTokens.colors.text.secondary,
        marginBottom: designTokens.spacing[6]
      }}>
        מה המטרות שלך ואיך אתה אוהב להתאמן?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing[6] }}>
        {/* Goals */}
        <div>
          <label style={{
            display: 'block',
            fontSize: designTokens.typography.fontSize.base,
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.text.primary,
            marginBottom: designTokens.spacing[3]
          }}>
            מטרות כושר
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2] }}>
            {goalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption('fitness_goals', option.value)}
                style={{
                  padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
                  backgroundColor: data.fitness_goals.includes(option.value)
                    ? designTokens.colors.interactive.primary
                    : designTokens.colors.background.secondary,
                  color: data.fitness_goals.includes(option.value)
                    ? designTokens.colors.text.inverse
                    : designTokens.colors.text.primary,
                  border: 'none',
                  borderRadius: designTokens.borderRadius.full,
                  fontSize: designTokens.typography.fontSize.sm,
                  fontWeight: designTokens.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workout Types */}
        <div>
          <label style={{
            display: 'block',
            fontSize: designTokens.typography.fontSize.base,
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.text.primary,
            marginBottom: designTokens.spacing[3]
          }}>
            סוגי אימון מועדפים
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2] }}>
            {workoutTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption('preferred_workout_types', option.value)}
                style={{
                  padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
                  backgroundColor: data.preferred_workout_types.includes(option.value)
                    ? designTokens.colors.interactive.primary
                    : designTokens.colors.background.secondary,
                  color: data.preferred_workout_types.includes(option.value)
                    ? designTokens.colors.text.inverse
                    : designTokens.colors.text.primary,
                  border: 'none',
                  borderRadius: designTokens.borderRadius.full,
                  fontSize: designTokens.typography.fontSize.sm,
                  fontWeight: designTokens.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label style={{
            display: 'block',
            fontSize: designTokens.typography.fontSize.base,
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.text.primary,
            marginBottom: designTokens.spacing[3]
          }}>
            אזורי התמקדות
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: designTokens.spacing[2] }}>
            {focusAreaOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleOption('focus_areas', option.value)}
                style={{
                  padding: `${designTokens.spacing[2]} ${designTokens.spacing[4]}`,
                  backgroundColor: data.focus_areas.includes(option.value)
                    ? designTokens.colors.interactive.primary
                    : designTokens.colors.background.secondary,
                  color: data.focus_areas.includes(option.value)
                    ? designTokens.colors.text.inverse
                    : designTokens.colors.text.primary,
                  border: 'none',
                  borderRadius: designTokens.borderRadius.full,
                  fontSize: designTokens.typography.fontSize.sm,
                  fontWeight: designTokens.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Input Field Component
const InputField: React.FC<{
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}> = ({ label, type, value, onChange, placeholder }) => {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: designTokens.typography.fontSize.sm,
        fontWeight: designTokens.typography.fontWeight.medium,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: designTokens.spacing[3],
          backgroundColor: designTokens.colors.background.secondary,
          border: `1px solid ${designTokens.colors.border.default}`,
          borderRadius: designTokens.borderRadius.md,
          fontSize: designTokens.typography.fontSize.base,
          color: designTokens.colors.text.primary
        }}
      />
    </div>
  );
};

// Reusable Select Field Component
const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: designTokens.typography.fontSize.sm,
        fontWeight: designTokens.typography.fontWeight.medium,
        color: designTokens.colors.text.primary,
        marginBottom: designTokens.spacing[2]
      }}>
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: designTokens.spacing[3],
          backgroundColor: designTokens.colors.background.secondary,
          border: `1px solid ${designTokens.colors.border.default}`,
          borderRadius: designTokens.borderRadius.md,
          fontSize: designTokens.typography.fontSize.base,
          color: designTokens.colors.text.primary
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
