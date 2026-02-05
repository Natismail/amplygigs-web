// src/hooks/useKYC.js - UPDATED TO MATCH YOUR COLUMN NAMES
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export function useKYC() {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ Fetch verification status - FIXED to prevent infinite loop
  const fetchVerification = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('musician_verifications')
        .select('*')
        .eq('musician_id', user.id)
        .maybeSingle(); // ⭐ Changed from .single() to .maybeSingle()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      setVerification(data);
    } catch (err) {
      console.error('Error fetching verification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]); // ⭐ Only depends on user, not user.id

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  // ⭐ Upload document to Supabase Storage - IMPROVED error handling
  const uploadDocument = async (file, documentType) => {
    if (!user || !file) {
      throw new Error('User or file is missing');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  // ⭐ Submit ID verification - IMPROVED
  const submitIDVerification = async ({ idType, idNumber, idFront, idBack }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setUploading(true);
    setError(null);

    try {
      // Upload ID images
      const [idFrontUrl, idBackUrl] = await Promise.all([
        uploadDocument(idFront, 'id_front'),
        uploadDocument(idBack, 'id_back'),
      ]);

      if (!idFrontUrl || !idBackUrl) {
        throw new Error('Failed to upload ID images');
      }

      // Create or update verification record
      const payload = {
        musician_id: user.id,
        id_type: idType,
        id_number: idNumber,
        id_front_image_url: idFrontUrl,
        id_back_image_url: idBackUrl,
        status: 'under_review',
        submitted_at: new Date().toISOString(),
      };

      const { data: verificationData, error: verificationError } = await supabase
        .from('musician_verifications')
        .upsert(payload, { 
          onConflict: 'musician_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      setVerification(verificationData);
      return { success: true, data: verificationData };
    } catch (err) {
      console.error('ID verification error:', err);
      const errorMessage = err.message || 'Failed to submit ID verification';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  // ⭐ Submit selfie verification
  const submitSelfieVerification = async (selfieFile) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setUploading(true);
    setError(null);

    try {
      const selfieUrl = await uploadDocument(selfieFile, 'selfie');
      if (!selfieUrl) throw new Error('Failed to upload selfie');

      const { data, error } = await supabase
        .from('musician_verifications')
        .update({
          selfie_image_url: selfieUrl,
          status: 'under_review', // ⭐ Update status when selfie is submitted
          updated_at: new Date().toISOString(),
        })
        .eq('musician_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setVerification(data);
      return { success: true, data };
    } catch (err) {
      console.error('Selfie verification error:', err);
      const errorMessage = err.message || 'Failed to submit selfie';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

  // ⭐ Submit phone verification
  const submitPhoneVerification = async (phoneNumber, otp) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setUploading(true);
    setError(null);

    try {
      // Call your OTP verification API
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // Update verification record
      const { data, error } = await supabase
        .from('musician_verifications')
        .update({
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('musician_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setVerification(data);
      return { success: true, data };
    } catch (err) {
      console.error('Phone verification error:', err);
      const errorMessage = err.message || 'Failed to verify phone';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUploading(false);
    }
  };

// Add to src/hooks/useKYC.js

const submitVerification = async (data) => {
  if (!user) return { success: false, error: 'Not authenticated' };

  setUploading(true);
  setError(null);

  try {
    // Upload all files
    const uploads = {};
    
    if (data.idDocument) {
      uploads.id_front_image_url = await uploadDocument(data.idDocument, 'id_document');
    }
    if (data.idFront) {
      uploads.id_front_image_url = await uploadDocument(data.idFront, 'id_front');
    }
    if (data.idBack) {
      uploads.id_back_image_url = await uploadDocument(data.idBack, 'id_back');
    }
    if (data.selfie) {
      uploads.selfie_image_url = await uploadDocument(data.selfie, 'selfie');
    }
    if (data.selfieWithID) {
      uploads.id_with_selfie_url = await uploadDocument(data.selfieWithID, 'selfie_with_id');
    }
    if (data.proofOfAddress) {
      uploads.proof_of_address_url = await uploadDocument(data.proofOfAddress, 'address_proof');
    }
    if (data.visaDocument) {
      // Create a unique filename for visa document
      const visaUrl = await uploadDocument(data.visaDocument, 'visa');
      uploads.visa_document_url = visaUrl;
    }

    // Create verification record
    const { data: verificationData, error: verificationError } = await supabase
      .from('musician_verifications')
      .upsert({
        musician_id: user.id,
        country: data.country || 'Nigeria',
        verification_type: data.verificationType || 'nigerian',
        is_british_citizen: data.isBritishCitizen || false,
        id_type: data.idType,
        id_number: data.idNumber,
        right_to_work_share_code: data.rightToWorkCode || null,
        visa_status: data.visaDetails || null,
        proof_of_address_type: data.proofOfAddressType || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        ...uploads
      }, {
        onConflict: 'musician_id'
      })
      .select()
      .single();

    if (verificationError) throw verificationError;

    setVerification(verificationData);
    return { success: true, data: verificationData };
  } catch (err) {
    console.error('Verification error:', err);
    setError(err.message);
    return { success: false, error: err.message };
  } finally {
    setUploading(false);
  }
};


  // ⭐ Calculate completion percentage - IMPROVED
  const getCompletionPercentage = useCallback(() => {
    if (!verification) return 0;

    let completed = 0;
    const total = 4; // ID, Phone, Selfie, Basic Info

    if (verification.id_front_image_url && verification.id_back_image_url) completed++;
    if (verification.phone_verified) completed++;
    if (verification.selfie_image_url) completed++;
    if (verification.id_number) completed++;

    return Math.round((completed / total) * 100);
  }, [verification]);

  // ⭐ Status checks
  const isVerified = verification?.status === 'approved';
  const isPending = verification?.status === 'under_review' || verification?.status === 'pending';
  const isRejected = verification?.status === 'rejected';
  const isUnverified = !verification || verification?.status === 'pending' || !verification?.status;

  return {
    verification,
    loading,
    uploading,
    error,
    isVerified,
    isPending,
    isRejected,
    isUnverified,
    completionPercentage: getCompletionPercentage(),
    submitIDVerification,
    submitSelfieVerification,
    submitPhoneVerification,
    submitVerification,
    uploadDocument,
    refreshVerification: fetchVerification,
  };
}