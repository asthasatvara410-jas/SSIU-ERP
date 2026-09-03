import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, AlertCircle, Play, ShieldAlert, Award } from 'lucide-react';
import { Badge } from '../../../components/common/Badge';
import { lmsCourseService } from '../services/lmsCourseService';
import { StudentMaskedQuestionItem, QuizEvaluationResult } from '../types';

export const OnlineQuizAssessmentDesk: React.FC = () => {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-cs401-mid');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [evaluationResult, setEvaluationResult] = useState<QuizEvaluationResult | null>(null);

  const studentPayload = lmsCourseService.getStudentQuizPayload(selectedQuizId);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!studentPayload) return;
    const formattedSubmission = {
      quizId: studentPayload.quizId,
      studentId: 'stud-001',
      timeTakenSeconds: 340,
      submittedAnswers: studentPayload.questions.map(q => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id] !== undefined ? answers[q.id] : -1
      }))
    };

    const evalResult = lmsCourseService.evaluateQuizAttempt(formattedSubmission);
    setEvaluationResult(evalResult);
  };

  const handleReset = () => {
    setAnswers({});
    setEvaluationResult(null);
  };

  if (!studentPayload) {
    return <div className="p-8 text-center text-slate-400">No active online quizzes available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="navy">{studentPayload.courseCode}</Badge>
              <Badge variant="purple">{studentPayload.durationMinutes} Minutes Allotted</Badge>
              <Badge variant="danger">Negative Marking Enabled (-1)</Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">{studentPayload.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure client-side sandbox. Correct answers are masked on the client and strictly evaluated server-side.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {evaluationResult ? (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Retake Assessment
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Submit & Evaluate Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result Card when evaluated */}
      {evaluationResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h4 className="text-base font-bold text-slate-900">Deterministic Evaluation Scorecard</h4>
            </div>
            <Badge variant={evaluationResult.hasPassed ? 'success' : 'danger'}>
              {evaluationResult.hasPassed ? 'Passed Assessment' : 'Needs Improvement'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block">Total Score</span>
              <span className="text-xl font-bold text-slate-900">
                {evaluationResult.totalMarksScored} / {evaluationResult.maxMarks}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block">Percentage</span>
              <span className="text-xl font-bold text-indigo-600">{evaluationResult.percentage}%</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-xs text-emerald-700 block">Correct Answers</span>
              <span className="text-xl font-bold text-emerald-700">{evaluationResult.correctAnswersCount}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl">
              <span className="text-xs text-rose-700 block">Incorrect (-1 penalty)</span>
              <span className="text-xl font-bold text-rose-700">{evaluationResult.incorrectAnswersCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {studentPayload.questions.map((q, qIndex) => {
          const breakdown = evaluationResult?.questionBreakdown.find(b => b.questionId === q.id);

          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {qIndex + 1}
                  </span>
                  <p className="font-semibold text-slate-900 text-sm">{q.questionText}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span>+{q.marks} / -{q.negativeMarks}</span>
                  {breakdown && (
                    <Badge variant={breakdown.isCorrect ? 'success' : 'danger'}>
                      {breakdown.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {q.options.map((opt, optIndex) => {
                  const isSelected = answers[q.id] === optIndex;
                  const isAuthoritativeCorrect = breakdown && breakdown.correctOption === optIndex;

                  let borderClass = 'border-slate-200 hover:border-slate-300';
                  let bgClass = 'bg-white';

                  if (isSelected) {
                    borderClass = 'border-indigo-600 ring-1 ring-indigo-600';
                    bgClass = 'bg-indigo-50/50';
                  }

                  if (evaluationResult) {
                    if (isAuthoritativeCorrect) {
                      borderClass = 'border-emerald-500 bg-emerald-50/60 font-semibold';
                    } else if (isSelected && !breakdown?.isCorrect) {
                      borderClass = 'border-rose-500 bg-rose-50/60';
                    }
                  }

                  return (
                    <button
                      key={optIndex}
                      type="button"
                      disabled={!!evaluationResult}
                      onClick={() => handleSelectOption(q.id, optIndex)}
                      className={`p-3 text-left rounded-lg border text-xs text-slate-700 flex items-center gap-2.5 transition-all ${borderClass} ${bgClass}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
