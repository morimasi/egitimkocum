
import React, { useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import Card from '../components/Card';
import { FlameIcon, TrophyIcon, StarIcon, RocketIcon } from '../components/Icons';
import { BadgeID } from '../types';

const BadgeIcon = ({ badgeId }: { badgeId: BadgeID }) => {
    const icons: { [key in BadgeID]: React.ReactNode } = {
        [BadgeID.FirstAssignment]: <StarIcon className="w-8 h-8 text-yellow-500" />,
        [BadgeID.HighAchiever]: <RocketIcon className="w-8 h-8 text-blue-500" />,
        [BadgeID.PerfectScore]: <TrophyIcon className="w-8 h-8 text-amber-500" />,
        [BadgeID.GoalGetter]: <TrophyIcon className="w-8 h-8 text-green-500" />,
        [BadgeID.StreakStarter]: <FlameIcon className="w-8 h-8 text-orange-500" />,
        [BadgeID.StreakMaster]: <FlameIcon className="w-8 h-8 text-red-500" />,
        [BadgeID.OnTimeSubmissions]: <StarIcon className="w-8 h-8 text-indigo-500" />,
    };
    return <>{icons[badgeId] || <TrophyIcon className="w-8 h-8 text-gray-400" />}</>;
};


const Motivasyon = () => {
    const { currentUser, badges } = useDataContext();
    
    const student = currentUser;

    if (!student) {
        return null;
    }

    const xpToNextLevel = (level: number) => (level * level) * 100;

    const currentLevel = useMemo(() => student.xp ? Math.floor(Math.sqrt(student.xp / 100)) + 1 : 1, [student.xp]);
    const xpForCurrentLevel = useMemo(() => xpToNextLevel(currentLevel - 1), [currentLevel]);
    const xpForNextLevel = useMemo(() => xpToNextLevel(currentLevel), [currentLevel]);

    const levelProgress = useMemo(() => {
        const totalXpForLevel = xpForNextLevel - xpForCurrentLevel;
        const currentXpInLevel = (student.xp || 0) - xpForCurrentLevel;
        return totalXpForLevel > 0 ? (currentXpInLevel / totalXpForLevel) * 100 : 0;
    }, [student.xp, xpForCurrentLevel, xpForNextLevel]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Motivasyon ve Başarımlar</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Seviye İlerlemen</h2>
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path className="text-gray-200 dark:text-gray-700"
                                        d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831
                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-primary-500"
                                        strokeDasharray={`${levelProgress}, 100`}
                                        d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831
                                          a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xs text-gray-500">Seviye</span>
                                    <span className="text-3xl font-bold">{currentLevel}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-gray-500">Toplam {student.xp || 0} XP</p>
                                <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>{xpForCurrentLevel} XP</span>
                                        <span>{xpForNextLevel} XP</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                                    </div>
                                    <p className="text-xs text-center mt-1 text-gray-500">Sonraki seviye için {Math.max(0, xpForNextLevel - (student.xp || 0))} XP daha kazanmalısın!</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card title="Başarı Rozetleri">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {badges.map(badge => {
                                const isEarned = student.earnedBadgeIds?.includes(badge.id);
                                return (
                                    <div key={badge.id} title={`${badge.name}: ${badge.description}`} className={`flex flex-col items-center text-center transition-opacity ${!isEarned ? 'opacity-30' : ''}`}>
                                        <div className={`p-4 rounded-full ${isEarned ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                            <BadgeIcon badgeId={badge.id} />
                                        </div>
                                        <p className="text-xs mt-2 font-semibold w-24 truncate">{badge.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card className="text-center bg-orange-500 text-white dark:bg-orange-600">
                        <FlameIcon className="w-16 h-16 mx-auto text-white/80 animate-float-subtle" />
                        <p className="text-6xl font-bold mt-2">{student.streak || 0}</p>
                        <p className="font-semibold">Günlük Seri</p>
                        <p className="text-sm opacity-80 mt-2">
                            {student.streak && student.streak > 0 ? `Harika gidiyorsun! Serini devam ettir.` : 'Bugün bir ödev teslim ederek serini başlat!'}
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Motivasyon;