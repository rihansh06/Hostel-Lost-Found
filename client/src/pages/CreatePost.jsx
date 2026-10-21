import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Upload, X, ShieldAlert, Plus, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'electronics', label: '📱 Electronics' },
  { value: 'clothing', label: '👕 Clothing' },
  { value: 'keys', label: '🔑 Keys' },
  { value: 'bottle', label: '🍶 Bottle / Flask' },
  { value: 'documents', label: '📄 Documents / Cards' },
  { value: 'other', label: '📦 Other Items' },
];

export default function CreatePost() {
  const navigate = useNavigate();

  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('electronics');
  const [spot, setSpot] = useState('');
  const [happenedAt, setHappenedAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Found-only fields
  const [hiddenDetails, setHiddenDetails] = useState('');
  const [questions, setQuestions] = useState(['']);

  const [spotsList, setSpotsList] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await api.get('/api/hostel/spots');
        const available = res.data.data || [];
        setSpotsList(available);
        if (available.length > 0) {
          setSpot(available[0]);
        }
      } catch (err) {
        console.error('Failed to load spots:', err);
      } finally {
        setLoadingSpots(false);
      }
    };
    fetchSpots();
  }, []);

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (images.length + selectedFiles.length > 3) {
      setError('You can upload a maximum of 3 images');
      return;
    }

    const updatedFiles = [...images, ...selectedFiles].slice(0, 3);
    setImages(updatedFiles);

    // Create object URLs for previews
    const previews = updatedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const updatedFiles = images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const addQuestion = () => {
    if (questions.length < 3) {
      setQuestions([...questions, '']);
    }
  };

  const updateQuestion = (index, val) => {
    const updated = [...questions];
    updated[index] = val;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!spot) {
      setError('Please select a hostel spot');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('spot', spot);
      if (happenedAt) {
        formData.append('happenedAt', new Date(happenedAt).toISOString());
      }

      images.forEach((file) => {
        formData.append('images', file);
      });

      if (type === 'found') {
        if (hiddenDetails) {
          formData.append('hiddenDetails', hiddenDetails);
        }
        const cleanedQuestions = questions.map((q) => q.trim()).filter(Boolean);
        if (cleanedQuestions.length > 0) {
          formData.append('verificationQuestions', JSON.stringify(cleanedQuestions));
        }
      }

      const res = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate(`/posts/${res.data.data._id}`);
    } catch (err) {
      console.error('Failed to create post:', err);
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Failed to create post. Please verify all fields.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Feed
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create a Lost / Found Report
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Provide detailed information to help residents and AI find matching items quickly
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-sm flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-rose-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center space-x-2 ${
                  type === 'lost'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🔍</span>
                <span>I Lost Something</span>
              </button>

              <button
                type="button"
                onClick={() => setType('found')}
                className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center space-x-2 ${
                  type === 'found'
                    ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🎁</span>
                <span>I Found Something</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Item Title *
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'lost'
                  ? 'e.g. Blue silicone case for AirPods Pro'
                  : 'e.g. Royal blue earphone case found'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Category & Spot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Hostel Spot / Location *
              </label>
              {loadingSpots ? (
                <div className="py-2.5 text-xs text-slate-400">Loading spots...</div>
              ) : (
                <select
                  value={spot}
                  onChange={(e) => setSpot(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {spotsList.map((s) => (
                    <option key={s} value={s}>
                      📍 {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Happened At */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Date & Approximate Time
            </label>
            <input
              type="datetime-local"
              value={happenedAt}
              onChange={(e) => setHappenedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              minLength={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe color, brand, condition, unique scratches, or where exactly it was seen..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Image Upload (up to 3) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Photos (Optional, max 3)
            </label>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((previewUrl, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50">
                    <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 3 && (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-indigo-600">Click to upload photos</span>
                <span className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* FOUND ITEMS ONLY: Hidden Details & Verification Questions */}
          {type === 'found' && (
            <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-5">
              <div className="flex items-start">
                <ShieldAlert className="w-5 h-5 text-teal-700 mr-2 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-teal-900">
                    Owner Verification & Anti-Fraud Protection
                  </h3>
                  <p className="text-xs text-teal-700 mt-0.5">
                    To prevent fraudulent claims, keep secret identifying markers private. Other residents will only see your verification questions.
                  </p>
                </div>
              </div>

              {/* Hidden Details */}
              <div>
                <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider mb-1">
                  🔒 Hidden Details (Never visible to other residents)
                </label>
                <textarea
                  rows={2}
                  value={hiddenDetails}
                  onChange={(e) => setHiddenDetails(e.target.value)}
                  placeholder="e.g. Serial number ends in 442, Batman sticker inside cover, contains 2 keys..."
                  className="w-full px-3.5 py-2 rounded-xl border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-teal-700/80 mt-1">
                  Visible ONLY to you and the hostel warden to cross-check with claims.
                </p>
              </div>

              {/* Verification Questions (1 to 3) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-teal-950 uppercase tracking-wider">
                    Verification Questions (1-3 questions for owner)
                  </label>
                  {questions.length < 3 && (
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Question
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => updateQuestion(idx, e.target.value)}
                        placeholder={`Question ${idx + 1}: e.g. What color is the keychain?`}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Publishing Report...' : 'Publish Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
