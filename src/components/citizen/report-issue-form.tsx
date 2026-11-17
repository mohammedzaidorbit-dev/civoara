'use client';

import React, { useState } from 'react';
import {
  Send,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CategorySelector } from './category-selector';
import { PhotoUploader } from './photo-uploader';
import { LocationPicker } from './location-picker';
import { IssueConfirmation } from './issue-confirmation';
import { submitIncidentAction, SubmitReportResult } from '@/lib/actions/incident';
import { useToast } from '@/components/ui/toast';

export function ReportIssueForm() {
  const { error: toastError, success: toastSuccess } = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number>(40.7128);
  const [longitude, setLongitude] = useState<number>(-74.006);
  const [locationDescription, setLocationDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<SubmitReportResult | null>(null);

  const handleCoordinatesChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    if (fieldErrors.latitude || fieldErrors.longitude) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.latitude;
        delete next.longitude;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!title.trim() || title.length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }
    if (!description.trim() || description.length < 15) {
      errors.description = 'Please provide more details (at least 15 characters)';
    }
    if (!category) {
      errors.category = 'Please select a category';
    }
    if (!locationDescription.trim() || locationDescription.length < 3) {
      errors.locationDescription = 'Please specify the street location or landmark';
    }
    if (latitude === undefined || latitude < -90 || latitude > 90) {
      errors.latitude = 'Valid latitude coordinate is required';
    }
    if (longitude === undefined || longitude < -180 || longitude > 180) {
      errors.longitude = 'Valid longitude coordinate is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      toastError('Validation Failed', 'Please correct the highlighted fields before submitting.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('locationDescription', locationDescription.trim());
      formData.append('isAnonymous', isAnonymous ? 'true' : 'false');

      if (photo) {
        formData.append('photo', photo);
      }

      const result = await submitIncidentAction(formData);

      if (!result.success) {
        toastError('Submission Error', result.error || 'Failed to submit incident report');
        setFieldErrors({ form: result.error || 'Submission failed' });
        setIsSubmitting(false);
        return;
      }

      toastSuccess('Grievance Logged', `Report filed under reference ${result.ticketNumber}`);
      setSubmissionResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network or server error during submission';
      toastError('Submission Failed', msg);
      setFieldErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setCategory('pothole');
    setDescription('');
    setPhoto(null);
    setLatitude(40.7128);
    setLongitude(-74.006);
    setLocationDescription('');
    setIsAnonymous(false);
    setFieldErrors({});
    setSubmissionResult(null);
  };

  // If successfully submitted, render Confirmation Screen
  if (submissionResult) {
    return (
      <IssueConfirmation
        reportResult={submissionResult}
        onReset={handleResetForm}
      />
    );
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-md border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">
              File a Civic Grievance
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Direct municipal intake with automated SLA routing, proximity clustering, and verified status updates.
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <Shield className="w-4 h-4 text-sky-700 shrink-0" />
            <span className="font-semibold">Official Citizen Portal</span>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">
          {fieldErrors.form && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{fieldErrors.form}</span>
            </div>
          )}

          {/* 1. Category Selector */}
          <CategorySelector
            selectedCategory={category}
            onSelect={(cat) => {
              setCategory(cat);
              if (fieldErrors.category) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.category;
                  return next;
                });
              }
            }}
            error={fieldErrors.category}
          />

          {/* 2. Issue Title */}
          <Input
            label="Issue Title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.title) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
            error={fieldErrors.title}
            placeholder="e.g. Hazardous deep pothole on southbound lane of 5th Avenue"
            helperText="Summarize the core problem concisely (min 5 characters)."
          />

          {/* 3. Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Description & Context <span className="text-rose-500 ml-1">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }
              }}
              placeholder="Describe the severity, duration, and any public safety risks or damage caused..."
              className={`
                w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y
                ${fieldErrors.description
                  ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 focus:border-sky-700 focus:ring-sky-700'
                }
              `}
            />
            {fieldErrors.description ? (
              <p className="text-xs text-rose-600">{fieldErrors.description}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Minimum 15 characters. Details help field officers bring correct repair equipment.
              </p>
            )}
          </div>

          {/* 4. Photograph Uploader */}
          <PhotoUploader
            selectedFile={photo}
            onPhotoSelected={(f) => setPhoto(f)}
          />

          {/* 5. Map Location & Coordinates */}
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            locationDescription={locationDescription}
            onCoordinatesChange={handleCoordinatesChange}
            onDescriptionChange={(desc) => {
              setLocationDescription(desc);
              if (fieldErrors.locationDescription) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.locationDescription;
                  return next;
                });
              }
            }}
            errors={{
              latitude: fieldErrors.latitude,
              longitude: fieldErrors.longitude,
              locationDescription: fieldErrors.locationDescription,
            }}
          />

          {/* 6. Anonymous / Public Disclosure Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="relative flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">
                  Submit Anonymously
                </span>
                <p className="text-slate-500 mt-0.5">
                  Your identity and contact info will be masked from all municipal records and public dashboards.
                </p>
              </div>
            </label>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50/60 border-t border-slate-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            By submitting, you agree to official municipal inspection and dispatch protocols.
          </p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Submit Grievance
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
