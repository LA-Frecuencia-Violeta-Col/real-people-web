import React, { useState, useEffect } from 'react';

export const Countdown = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const target = new Date(targetDate).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const items = [
        { label: 'DÍAS', value: timeLeft.days },
        { label: 'HORAS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEG', value: timeLeft.seconds },
    ];

    return (
        <div className="flex space-x-4 md:space-x-16 justify-center mt-8 md:mt-12">
            {items.map((item) => (
                <div key={item.label} className="text-center">
                    <div className="text-3xl md:text-6xl font-display font-bold mb-1 md:mb-2">{String(item.value).padStart(2, '0')}</div>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] text-gold font-archivo font-black uppercase">{item.label}</div>
                </div>
            ))}
        </div>
    );
};
