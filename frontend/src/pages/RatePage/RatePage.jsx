import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Title, Spinner, Card, Text } from "@telegram-apps/telegram-ui";
import { Page } from "@/components/Page.tsx";
import useFetch from "@/hooks/useFetch";
import { getData, postData } from "@/api";
import { getRatePageImageSize } from "@/utils/imageSize";
import "./RatePage.css";

// Helper function to check if person has a real photo (not stock/fallback)
function hasRealPhoto(photo) {
    if (!photo) return false;

    if (photo.includes("pravatar.cc") || photo.includes("placeholder")) {
        return false;
    }

    if (photo.startsWith("data:image/") && photo.includes("base64,")) return true;
    if (
        photo.length > 100 &&
        (photo.startsWith("/9j/") ||
            photo.startsWith("iVBORw0KGgo") ||
            photo.match(/^[A-Za-z0-9+/=]{100,}$/))
    ) {
        return true;
    }

    if (photo.startsWith("http://") || photo.startsWith("https://")) return true;

    if (photo.length > 100 && !photo.startsWith("data:") && !photo.includes(".")) {
        return true;
    }

    return false;
}

// Return proper image URL or fallback avatar
function getPhotoUrl(photo) {
    if (!photo) return getFallbackAvatar();

    if (photo.includes("pravatar.cc") || photo.includes("placeholder")) {
        return getFallbackAvatar();
    }

    if (photo.startsWith("data:") || photo.startsWith("http://") || photo.startsWith("https://")) {
        return photo;
    }

    const format = "jpeg";
    return `data:image/${format};base64,${photo}`;
}

// Default SVG avatar
function getFallbackAvatar() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function RatePage() {
    const { gender } = useParams();
    const isMale = gender === "male";

    // Read filters from localStorage
    const [onlyWithPhoto, setOnlyWithPhoto] = useState(() => {
        return localStorage.getItem("onlyWithPhoto") === "true";
    });
    const [selectedClass, setSelectedClass] = useState(
        localStorage.getItem("selectedClass") || ""
    );

    // Keep filters updated if user goes back and changes them
    useEffect(() => {
        const checkStorage = () => {
            const newPhoto = localStorage.getItem("onlyWithPhoto") === "true";
            const newClass = localStorage.getItem("selectedClass") || "";

            if (newPhoto !== onlyWithPhoto) setOnlyWithPhoto(newPhoto);
            if (newClass !== selectedClass) setSelectedClass(newClass);
        };

        checkStorage();
        const interval = setInterval(checkStorage, 500);
        return () => clearInterval(interval);
    }, [onlyWithPhoto, selectedClass]);

    // API URL includes filters and image size (calculated based on device pixel ratio and screen size)
    const imageSize = getRatePageImageSize();
    const apiUrl = `/api/persons/duo/filter/${isMale ? "male" : "female"}?haveAvatar=${onlyWithPhoto}${
        selectedClass ? `&oldSchool=${selectedClass}` : ""
    }&photoWidth=${imageSize.width}&photoHeight=${imageSize.height}`;

    const { data: duoRaw, loading, error, setData } = useFetch(apiUrl);
    const [pickedId, setPickedId] = useState(null);
    const [duoKey, setDuoKey] = useState(0);
    const [isVoting, setIsVoting] = useState(false);

    const duo = useMemo(() => duoRaw || [], [duoRaw]);

    const loadNewDuo = async () => {
        const imageSize = getRatePageImageSize();
        const newApiUrl = `/api/persons/duo/filter/${isMale ? "male" : "female"}?haveAvatar=${onlyWithPhoto}${
            selectedClass ? `&oldSchool=${selectedClass}` : ""
        }&photoWidth=${imageSize.width}&photoHeight=${imageSize.height}`;

        const { data, success } = await getData(newApiUrl);
        if (success) {
            setData(data);
            setDuoKey((prev) => prev + 1);
        }
    };

    const handleVote = async (selectedId) => {
        if (isVoting) return;

        setIsVoting(true);
        setPickedId(selectedId);

        const winnerId = selectedId;
        const loserId = duo?.find((p) => p.id !== selectedId)?.id;

        if (!winnerId || !loserId) {
            console.error("Could not determine winner and loser");
            setIsVoting(false);
            setPickedId(null);
            return;
        }

        try {
            const voteResult = await postData(`/api/persons/duo/vote`, {
                winnerId,
                loserId,
            });

            if (!voteResult.success) {
                console.error("Vote failed:", voteResult.message);
                setIsVoting(false);
                setPickedId(null);
                return;
            }

            setTimeout(() => {
                setPickedId(null);
                setIsVoting(false);
                loadNewDuo();
            }, 800);
        } catch (e) {
            console.error("Rating update failed", e);
            setPickedId(null);
            setIsVoting(false);
        }
    };

    if (loading) {
        return (
            <Page back={true}>
                <div className="rate-page">
                    <div className="rate-loading">
                        <Spinner size="l" />
                    </div>
                </div>
            </Page>
        );
    }

    if (error) {
        console.error("useFetch error:", error);
        return (
            <Page back={true}>
                <div className="rate-page">
                    <div className="rate-error">Ошибка: {error}</div>
                </div>
            </Page>
        );
    }

    if (!duo || duo.length < 2) {
        return (
            <Page back={true}>
                <div className="rate-page">
                    <div className="rate-empty">Не удалось загрузить дуэт</div>
                </div>
            </Page>
        );
    }

    return (
        <Page back={true}>
            <div className="rate-page">
                <div className="rate-header">
                    <Title level="2" weight="2">
                        Кто привлекательнее?
                    </Title>
                    {selectedClass && (
                        <Text className="rate-filter-info">
                            {selectedClass === "false" 
                                ? "Младшие классы" 
                                : selectedClass === "true" 
                                ? "Старшие классы" 
                                : ""}
                        </Text>
                    )}
                </div>

                <div className="rate-duo" key={duoKey}>
                    {duo.map((person) => {
                        const isPicked = pickedId === person.id;
                        return (
                            <Card
                                key={`${duoKey}-${person.id}`}
                                className={`rate-card rate-card--appear ${
                                    isPicked ? "rate-card--picked" : ""
                                } ${isVoting && !isPicked ? "rate-card--disabled" : ""}`}
                                onClick={() => handleVote(person.id)}
                            >
                                <div className="rate-card-content">
                                    {isPicked && (
                                        <div className="rate-pick-indicator">
                                            <div className="rate-checkmark">✓</div>
                                        </div>
                                    )}
                                    <div className="rate-avatar-wrapper">
                                        <img
                                            src={getPhotoUrl(person.photo)}
                                            alt={`${person.name} ${person.surname}`}
                                            className="rate-avatar-image"
                                        />
                                    </div>
                                    <div className="rate-info">
                                        <Text weight="2" className="rate-name">
                                            {person.name} {person.surname}
                                        </Text>
                                        <Text className="rate-class">{person.schoolClass}</Text>
                                        <Text className="rate-rating">⭐ {person.rating}</Text>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </Page>
    );
}
