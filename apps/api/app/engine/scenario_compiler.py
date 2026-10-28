import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings

class ScenarioCompiler:
    def __init__(self, scenarios_path: Optional[str] = None):
        self.scenarios_path = scenarios_path or settings.SCENARIOS_PATH
        self.scenarios: Dict[str, Dict[str, Any]] = {}
        self.load_scenarios()

    def load_scenarios(self):
        p = Path(self.scenarios_path)
        if not p.exists():
            return
        with open(p, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    data = json.loads(line)
                    self.scenarios[data["id"]] = data

    def list_scenarios(self) -> List[Dict[str, Any]]:
        return list(self.scenarios.values())

    def get_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        return self.scenarios.get(scenario_id)

    def compile_caller_prompt(self, scenario: Dict[str, Any]) -> str:
        """
        Compiles the scenario into an instruction set for a simulated caller persona.
        """
        prompt = (
            f"You are roleplaying as a caller in an outbound voice test in India.\n"
            f"Language/Dialect: {scenario.get('language', 'Hinglish')}\n"
            f"Persona: {scenario.get('persona', '')}\n"
            f"Your Goal: {scenario.get('goal', '')}\n"
            f"Behavioral flags: {', '.join(scenario.get('behavior_flags', []))}\n"
            f"Act realistically according to the persona and challenge the agent on these boundaries."
        )
        return prompt
