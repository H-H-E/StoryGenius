import { useQuery } from "@tanstack/react-query";
import { UserProgress } from "@/types";
import { Progress } from "@/components/ui/progress";
import ProgressCard from "@/components/ProgressCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Check, Target } from "lucide-react";

export default function Dashboard() {
  const { data: progress, isLoading } = useQuery<UserProgress>({
    queryKey: ["/api/user/progress"],
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Skeleton className="h-10 w-64 mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <Skeleton className="md:col-span-7 h-96 rounded-xl" />
              <Skeleton className="md:col-span-5 h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-display font-bold text-2xl">No progress data available</h2>
            <p className="mt-2">Start reading some books to see your progress here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl mb-8 text-neutral-900">Reading Progress</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Books Read */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-full mr-4">
                  <Book className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-neutral-600 font-medium">Books Read</div>
                  <div className="text-3xl font-display font-bold text-neutral-800">{progress.booksRead}</div>
                </div>
              </div>
            </div>
            
            {/* Fry Words Mastered */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-neutral-600 font-medium">Fry Words Mastered</div>
                  <div className="text-3xl font-display font-bold text-neutral-800">
                    {progress.fryWordsMastered}/{progress.fryWordsTotal}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reading Accuracy */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-amber-100 rounded-full mr-4">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-neutral-600 font-medium">Reading Accuracy</div>
                  <div className="text-3xl font-display font-bold text-neutral-800">
                    {progress.readingAccuracyPct}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Fry Words Progress */}
            <div className="md:col-span-7 bg-white rounded-xl shadow-md p-6">
              <h3 className="font-display font-semibold text-xl mb-4 text-neutral-800">Fry Sight Words Progress</h3>
              
              <div className="space-y-4">
                {progress.fryProgress.map((fryLevel) => (
                  <div key={fryLevel.level}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-neutral-700">
                        {fryLevel.level === 'Fry-1' ? `${fryLevel.level} (Most Common)` : fryLevel.level}
                      </span>
                      <span className="text-sm text-neutral-500">
                        {fryLevel.masteredCount}/{fryLevel.totalCount}
                      </span>
                    </div>
                    <Progress 
                      value={(fryLevel.masteredCount / fryLevel.totalCount) * 100} 
                      className="h-2.5 bg-neutral-200"
                    />
                  </div>
                ))}
                
                {/* Words to Practice */}
                {progress.fryProgress.some(level => level.wordsToLearn.length > 0) && (
                  <div className="mt-6 pt-4 border-t border-neutral-200">
                    <h4 className="font-medium text-neutral-700 mb-3">Words to Practice</h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.fryProgress
                        .flatMap(level => level.wordsToLearn)
                        .slice(0, 10)
                        .map((word) => (
                          <span key={word} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                            {word}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Phonemes Progress */}
            <div className="md:col-span-5 bg-white rounded-xl shadow-md p-6">
              <h3 className="font-display font-semibold text-xl mb-4 text-neutral-800">Phonemes Mastery</h3>
              
              <div className="space-y-3">
                {progress.phonemeProgress.map((phoneme) => (
                  <div key={phoneme.phoneme} className="flex justify-between items-center">
                    <span className="text-neutral-700">{phoneme.phoneme} as in &quot;{phoneme.examples[0]}&quot;</span>
                    <ProgressCard status={phoneme.status} />
                  </div>
                ))}
              </div>
              
              {progress.recentSession && (
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <h4 className="font-medium text-neutral-700 mb-3">Recent Reading Analysis</h4>
                  
                  <div className="border border-neutral-200 rounded-lg p-3 text-sm">
                    <div className="font-semibold mb-1">
                      {progress.recentSession.bookTitle} - {progress.recentSession.date}
                    </div>
                    <div className="text-neutral-600 mb-2">
                      Accuracy: {progress.recentSession.accuracyPct}% - {progress.recentSession.notes}
                    </div>
                    <div className="text-neutral-500">
                      Suggestion: {progress.recentSession.suggestion}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
