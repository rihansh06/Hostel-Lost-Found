import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Upload,
  X,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Camera,
  MapPin,
  Calendar,
  Lock,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'bottle', label: 'Bottle / Flask', icon: '🍶' },
  { value: 'documents', label: 'Documents / ID', icon: '📄' },
  { value: 'other', label: 'Other Item', icon: '📦' },
];

const QUESTION_SUGGESTIONS = [
  'What brand or model is engraved on it?',
  'What color is the keychain, sleeve, or strap?',
  'What stickers, scratches, or markings are visible?',
  'What is set as the lock screen / wallpaper?',
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
        const res = await api.get('/hostel/spots');
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

    const previews = updatedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const updatedFiles = images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(updatedFiles);
    setImagePreviews(updatedPreviews);
  };

  const addQuestion = (customText = '') => {
    if (questions.length < 3) {
      setQuestions([...questions, customText]);
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

      const res = await api.post('/posts', formData, {
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
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Feed</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-indigo-950/5 p-6 sm:p-8">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Community Item Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Create Item Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fill in descriptive details. Our AI model will automatically scan existing posts for similarities.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              What are you reporting? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`p-4 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3 cursor-pointer ${
                  type === 'lost'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-sm shadow-rose-500/10'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                <span className="text-xl">🔍</span>
                <div className="text-left">
                  <div className="font-black">I Lost Something</div>
                  <div className="text-[10px] font-medium opacity-80">Searching for my misplaced item</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('found')}
                className={`p-4 rounded-2xl font-bold text-xs sm:text-sm border-2 transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-3 cursor-pointer ${
                  type === 'found'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                <span className="text-xl">✨</span>
                <div className="text-left">
                  <div className="font-black">I Found Something</div>
                  <div className="text-[10px] font-medium opacity-80">Looking for the rightful owner</div>
                </div>
              </button>
            </div>
          </div>

          {/* Item Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  ? 'e.g. Navy Blue AirPods Pro Case with Carbiner'
                  : 'e.g. Dark Blue Earphone Case Found in Sofa'
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Category & Spot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hostel Spot / Room *
              </label>
              {loadingSpots ? (
                <div className="py-2.5 text-xs text-slate-400">Loading spots...</div>
              ) : (
                <select
                  value={spot}
                  onChange={(e) => setSpot(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

          {/* Approximate Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>When Did It Happen? (Date & Approx Time)</span>
            </label>
            <input
              type="datetime-local"
              value={happenedAt}
              onChange={(e) => setHappenedAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              minLength={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide color, brand, condition, scratches, or any unique traits to maximize AI match confidence..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium leading-relaxed"
            />
          </div>

          {/* Photos Upload (max 3) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span>Photos (Optional, max 3)</span>
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                {images.length}/3 attached
              </span>
            </div>

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {imagePreviews.map((previewUrl, idx) => (
                  <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 bg-slate-50 shadow-xs">
                    <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 3 && (
              <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-indigo-600">Choose images to upload</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WebP up to 5MB each</span>
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
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-5">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    Owner Verification & Anti-Fraud Security
                  </h3>
                  <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                    Protect the item from fraudulent claimants. Private details are encrypted and never shown publicly; only your challenge questions will be displayed.
                  </p>
                </div>
              </div>

              {/* Hidden Details */}
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Confidential Secrets (Never published publicly)</span>
                </label>
                <textarea
                  rows={2}
                  value={hiddenDetails}
                  onChange={(e) => setHiddenDetails(e.target.value)}
                  placeholder="e.g. Serial ending in 981, initials 'AR' etched on bottom, contains 3 coins..."
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-emerald-700 mt-1">
                  🔒 Visible ONLY to you and the warden to evaluate submitted claims.
                </p>
              </div>

              {/* Verification Questions (1 to 3) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Owner Challenge Questions (1-3 required)</span>
                  </label>
                  {questions.length < 3 && (
                    <button
                      type="button"
                      onClick={() => addQuestion('')}
                      className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
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
                        placeholder={`Question ${idx + 1}: e.g. What color is the inner sleeve?`}
                        className="flex-1 px-4 py-2 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Question suggestions */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                    💡 Quick Suggestions (Click to add):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUESTION_SUGGESTIONS.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          const emptyIdx = questions.findIndex((q) => !q.trim());
                          if (emptyIdx !== -1) {
                            updateQuestion(emptyIdx, suggestion);
                          } else if (questions.length < 3) {
                            addQuestion(suggestion);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <span>Publish Report</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
