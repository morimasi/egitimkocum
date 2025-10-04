import React, { useMemo } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { User, BadgeID } from '../../types';
import Card from '../Card';
import { TrophyIcon, FlameIcon, StarIcon, RocketIcon, KeyIcon, AwardIcon, ZapIcon } from '../Icons';

const BadgeIcon = ({ badgeId }: { badgeId: BadgeID }) => {
    const icons: { [key in BadgeID]?: React.ReactNode } = {
        [BadgeID.FirstAssignment]: <StarIcon className="w-8 h-8 text-yellow-500" />,
        [BadgeID.HighAchiever]: <RocketIcon className="w-8 h-8 text-blue-500" />,
        [BadgeID.PerfectScore]: <TrophyIcon className="w-8 h-8 text-amber-500" />,
        [BadgeID.GoalGetter]: <AwardIcon className="w-8 h-8 text-green-500" />,
        [BadgeID.StreakStarter]: <ZapIcon className="w-8 h-8 text-orange-500" />,
        [BadgeID.StreakMaster]: <FlameIcon className="w-8 h-8 text-red-500" />,
        [BadgeID.OnTimeSubmissions]: <KeyIcon className="w-8 h-8 text-indigo-500" />,
    };
    return <>{icons[badgeId] || <TrophyIcon className="w-8 h-8 text-gray-400" />}</>;
};

const MotivationTab = ({ student }: { student: User }) => {
    const { badges } = useDataContext();

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
        <div className="animate-fade-in space-y-4">
            <Card>
                <h4 className="font-semibold mb-2">Seviye ve Tecrübe Puanı (XP)</h4>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex flex-col items-center justify-center font-bold">
                        <span className="text-xs">SEVİYE</span>
                        <span className="text-3xl">{currentLevel}</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                            <span>{student.xp || 0} XP</span>
                            <span className="text-gray-500">{xpForNextLevel} XP</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div className="bg-primary-500 h-4 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                        </div>
                    </div>
                </div>
            </Card>
            <Card title="Kazanılan Rozetler">
                <div className="flex flex-wrap gap-4">
                    {badges.map(badge => {
                        const isEarned = student.earnedBadgeIds?.includes(badge.id);
                        return (
                            <div key={badge.id} title={`${badge.name}: ${badge.description}`} className={`text-center transition-opacity ${!isEarned && 'opacity-30'}`}>
                                <div className={`p-3 rounded-full ${isEarned ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <BadgeIcon badgeId={badge.id} />
                                </div>
                                <p className="text-xs mt-1 w-20 truncate">{badge.name}</p>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};
export default MotivationTab;