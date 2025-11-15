import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Title, Text, Image, Select } from "@telegram-apps/telegram-ui";
import logo from "../../assets/happy-banana.gif";
import "./LandingPage.css";

export function LandingPage() {
    const navigate = useNavigate();
    const [onlyWithPhoto, setOnlyWithPhoto] = useState(
        localStorage.getItem("onlyWithPhoto") === "true"
    );
    const [selectedClass, setSelectedClass] = useState(
        localStorage.getItem("selectedClass") || ""
    );

    const handleNavigate = (gender) => {
        // Save filters in localStorage
        if (onlyWithPhoto) {
            localStorage.setItem("onlyWithPhoto", "true");
        } else {
            localStorage.removeItem("onlyWithPhoto");
        }

        if (selectedClass) {
            localStorage.setItem("selectedClass", selectedClass);
        } else {
            localStorage.removeItem("selectedClass");
        }

        // Navigate with query param for oldSchool filter
        const classQuery = selectedClass ? `?oldSchool=${selectedClass}` : "";
        navigate(`/rate/${gender}${classQuery}`);
    };

    return (
        <div className="landing-page">
            <div className="landing-content">
                <Image src={logo} alt="239FaceSmash" size={300} className="landing-logo" />
                <Title level="1" weight="1" className="landing-title">
                    239FaceSmash
                </Title>

                <Text className="landing-description">
                    Оцените привлекательность учеников школы 239.
                    Выберите категорию и начните голосование!
                </Text>

                <div className="landing-buttons">
                    <Button
                        size="l"
                        stretched
                        onClick={() => handleNavigate("female")}
                        className="landing-button"
                    >
                        Оценить девушек
                    </Button>

                    <Button
                        size="l"
                        stretched
                        onClick={() => handleNavigate("male")}
                        className="landing-button"
                    >
                        Оценить парней
                    </Button>

                    <Button
                        size="l"
                        stretched
                        mode="outline"
                        onClick={() => navigate("/ratings")}
                        className="landing-button-outline"
                    >
                        Таблица рейтингов
                    </Button>

                    <Button
                        size="m"
                        stretched
                        mode={onlyWithPhoto ? "filled" : "outline"}
                        onClick={() => setOnlyWithPhoto(!onlyWithPhoto)}
                        className="landing-button-filter"
                    >
                        Показывать только с фото
                    </Button>
                    {/* ✅ Class Filter */}
                    <div className="landing-select-wrapper">
                        <Select
                            header="Выберите класс"
                            value={
                                selectedClass === "false" 
                                    ? "Младшие классы" 
                                    : selectedClass === "true" 
                                    ? "Старшие классы" 
                                    : "Все классы"
                            }
                            onChange={(value) => {
                                const selectedValue = value.target.value;
                                if (selectedValue === "Все классы") {
                                    setSelectedClass("");
                                } else if (selectedValue === "Младшие классы") {
                                    setSelectedClass("false");
                                } else if (selectedValue === "Старшие классы") {
                                    setSelectedClass("true");
                                }
                            }}
                        >
                            <option>Все классы</option>
                            <option>Младшие классы</option>
                            <option>Старшие классы</option>
                        </Select>
                    </div>
                </div>

                <Text className="landing-footer-text">
                    Помни, что чем чаще ты попадаешься тем чаще тебя лайкают. Напиши боту, чтобы поставить автар или удалить его.
                </Text>
            </div>
        </div>
    );
}
