/**
 * Profile Page - User profile setup and management
 * Displays ProfileWizard for onboarding or profile editing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileWizard } from '../components/ProfileWizard';
import { designTokens } from '../design-system/tokens';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check current profile completion
    try {
      const response = await fetch('http://localhost:8000/api/v1/profile/completion-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileCompletion(data.profile_completion_percentage);
      }
    } catch (error) {
      console.error('Failed to fetch profile status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    // Navigate to chat after completing profile
    navigate('/');
  };

  const handleSkip = () => {
    // Allow skipping profile setup
    navigate('/');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: designTokens.colors.background.primary
      }}>
        <div style={{
          fontSize: designTokens.typography.fontSize.xl,
          color: designTokens.colors.text.secondary
        }}>
          טוען...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: designTokens.colors.background.primary,
      padding: designTokens.spacing[6],
      direction: 'rtl'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: designTokens.spacing[8]
      }}>
        <h1 style={{
          fontSize: designTokens.typography.fontSize['4xl'],
          fontWeight: designTokens.typography.fontWeight.bold,
          color: designTokens.colors.text.primary,
          marginBottom: designTokens.spacing[2],
          textAlign: 'center'
        }}>
          הגדרת פרופיל
        </h1>
        <p style={{
          fontSize: designTokens.typography.fontSize.lg,
          color: designTokens.colors.text.secondary,
          textAlign: 'center',
          marginBottom: designTokens.spacing[4]
        }}>
          עזור לנו להכיר אותך כדי להמליץ על אימונים מותאמים במיוחד עבורך
        </p>

        {profileCompletion > 0 && (
          <div style={{
            textAlign: 'center',
            padding: designTokens.spacing[4],
            backgroundColor: designTokens.colors.semantic.info + '20',
            borderRadius: designTokens.borderRadius.lg,
            marginBottom: designTokens.spacing[6]
          }}>
            <div style={{
              fontSize: designTokens.typography.fontSize.base,
              color: designTokens.colors.text.primary,
              marginBottom: designTokens.spacing[2]
            }}>
              השלמת פרופיל: {profileCompletion}%
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: designTokens.colors.background.secondary,
              borderRadius: designTokens.borderRadius.full,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${profileCompletion}%`,
                height: '100%',
                backgroundColor: designTokens.colors.interactive.primary,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Profile Wizard */}
      <ProfileWizard
        onComplete={handleComplete}
        onSkip={handleSkip}
      />

      {/* Footer */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        marginTop: designTokens.spacing[8],
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: designTokens.typography.fontSize.sm,
          color: designTokens.colors.text.secondary
        }}>
          ניתן לעדכן את הפרופיל בכל עת מההגדרות
        </p>
      </div>
    </div>
  );
};

export default Profile;
