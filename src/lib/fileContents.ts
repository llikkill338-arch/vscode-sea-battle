// C++ project source files for the editor
export const fileContents: Record<string, string> = {
  'main.cpp': `// ============================================================
// Sea Battle (Morskaya Bitva) — Main Entry Point
// A pirate-themed console battleship game
// ============================================================

#include <iostream>
#include <ctime>
#include <cstdlib>
#include "Game.h"

int main() {
    // Seed random number generator
    std::srand(static_cast<unsigned>(std::time(nullptr)));
    
    // Set console to UTF-8 for Russian characters
    #ifdef _WIN32
        system("chcp 65001 > nul");
    #endif
    
    Game game;
    game.run();
    
    return 0;
}
`,
  'Board.h': `// ============================================================
// Board — Game grid and ship placement logic
// ============================================================
#pragma once
#include <vector>
#include <array>

enum class CellState {
    EMPTY, SHIP, HIT, MISS, SUNK
};

struct Cell {
    CellState state = CellState::EMPTY;
    int shipId = -1;
};

class Board {
public:
    static constexpr int SIZE = 10;
    static constexpr int SHIP_COUNT = 10;
    
    Board();
    
    // Grid operations
    Cell getCell(int x, int y) const;
    void setCell(int x, int y, CellState state, int shipId = -1);
    
    // Ship placement
    bool canPlaceShip(int x, int y, int size, bool horizontal) const;
    bool placeShip(int x, int y, int size, bool horizontal, int shipId);
    
    // Shooting
    bool isValidShot(int x, int y) const;
    CellState shoot(int x, int y);
    
    // Aura marking (autovycherkivanie)
    void markAura(int shipId);
    
    // Utilities
    bool allShipsSunk() const;
    int getShipCellsRemaining() const;
    void display(bool revealShips = false) const;
    void autoPlaceAllShips();
    
private:
    std::array<std::array<Cell, SIZE>, SIZE> grid;
    std::vector<int> shipSizes = {4, 3, 3, 2, 2, 2, 1, 1, 1, 1};
    
    bool isInBounds(int x, int y) const;
    bool hasAdjacentShip(int x, int y) const;
};
`,
  'Board.cpp': `// ============================================================
// Board Implementation
// ============================================================
#include "Board.h"
#include <iostream>

Board::Board() { for (auto& row : grid) for (auto& cell : row) cell = Cell{}; }

Cell Board::getCell(int x, int y) const { return isInBounds(x, y) ? grid[y][x] : Cell{}; }

void Board::setCell(int x, int y, CellState state, int shipId) {
    if (isInBounds(x, y)) { grid[y][x].state = state; grid[y][x].shipId = shipId; }
}

bool Board::isInBounds(int x, int y) const { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }

bool Board::hasAdjacentShip(int x, int y) const {
    for (int dy = -1; dy <= 1; dy++)
        for (int dx = -1; dx <= 1; dx++)
            if (dx != 0 || dy != 0) { int nx = x + dx, ny = y + dy; if (isInBounds(nx, ny) && grid[ny][nx].state == CellState::SHIP) return true; }
    return false;
}

bool Board::canPlaceShip(int x, int y, int size, bool horizontal) const {
    for (int i = 0; i < size; i++) {
        int px = horizontal ? x + i : x, py = horizontal ? y : y + i;
        if (!isInBounds(px, py) || grid[py][px].state != CellState::EMPTY || hasAdjacentShip(px, py)) return false;
    }
    return true;
}

bool Board::placeShip(int x, int y, int size, bool horizontal, int shipId) {
    if (!canPlaceShip(x, y, size, horizontal)) return false;
    for (int i = 0; i < size; i++) { int px = horizontal ? x + i : x, py = horizontal ? y : y + i; setCell(px, py, CellState::SHIP, shipId); }
    return true;
}

bool Board::isValidShot(int x, int y) const { return isInBounds(x, y) && (grid[y][x].state == CellState::EMPTY || grid[y][x].state == CellState::SHIP); }

CellState Board::shoot(int x, int y) {
    if (!isValidShot(x, y)) return CellState::MISS;
    if (grid[y][x].state == CellState::SHIP) { setCell(x, y, CellState::HIT, grid[y][x].shipId); return CellState::HIT; }
    setCell(x, y, CellState::MISS); return CellState::MISS;
}

void Board::markAura(int shipId) {
    for (int y = 0; y < SIZE; y++)
        for (int x = 0; x < SIZE; x++)
            if (grid[y][x].shipId == shipId)
                for (int dy = -1; dy <= 1; dy++)
                    for (int dx = -1; dx <= 1; dx++)
                        if (dx != 0 || dy != 0) { int nx = x + dx, ny = y + dy; if (isInBounds(nx, ny) && grid[ny][nx].state == CellState::EMPTY) setCell(nx, ny, CellState::MISS); }
}

bool Board::allShipsSunk() const {
    for (const auto& row : grid) for (const auto& cell : if (cell.state == CellState::SHIP) return false;
    return true;
}

void Board::autoPlaceAllShips() {
    int shipId = 0;
    for (int size : shipSizes) {
        bool placed = false;
        for (int attempt = 0; attempt < 1000 && !placed; attempt++) {
            bool horiz = rand() % 2 == 0;
            int x = rand() % (horiz ? SIZE - size + 1 : SIZE);
            int y = rand() % (horiz ? SIZE : SIZE - size + 1);
            if (canPlaceShip(x, y, size, horiz)) { placeShip(x, y, size, horiz, shipId++); placed = true; }
        }
    }
}
`,
  'Ship.h': `// ============================================================
// Ship — Individual ship data and state
// ============================================================
#pragma once
#include <vector>

struct Position { int x; int y; };

class Ship {
public:
    int id;
    int size;
    std::vector<Position> positions;
    int hits = 0;
    bool sunk = false;
    
    Ship(int id, int size) : id(id), size(size) {}
    
    void addPosition(int x, int y) { positions.push_back({x, y}); }
    void registerHit() { hits++; if (hits >= size) sunk = true; }
    bool isSunk() const { return sunk; }
    int getRemaining() const { return size - hits; }
};
`,
  'Ship.cpp': `// ============================================================
// Ship Implementation
// ============================================================
#include "Ship.h"
`,
  'Player.h': `// ============================================================
// Player — Fleet management and shot history
// ============================================================
#pragma once
#include <vector>
#include <memory>
#include "Ship.h"
#include "Board.h"

class Player {
public:
    Board board;
    std::vector<std::unique_ptr<Ship>> fleet;
    
    void createFleet();
    Ship* getShip(int id) const;
    int getTotalShipCells() const;
    int getRemainingShipCells() const;
    bool hasLost() const;
    
private:
    const int shipSizes[10] = {4, 3, 3, 2, 2, 2, 1, 1, 1, 1};
};
`,
  'Player.cpp': `// ============================================================
// Player Implementation
// ============================================================
#include "Player.h"

void Player::createFleet() {
    for (int i = 0; i < 10; i++) fleet.push_back(std::make_unique<Ship>(i, shipSizes[i]));
}

Ship* Player::getShip(int id) const { return (id >= 0 && id < fleet.size()) ? fleet[id].get() : nullptr; }
int Player::getTotalShipCells() const { int total = 0; for (const auto& ship : fleet) total += ship->size; return total; }
int Player::getRemainingShipCells() const { int rem = 0; for (const auto& ship : fleet) rem += ship->getRemaining(); return rem; }
bool Player::hasLost() const { for (const auto& ship : fleet) if (!ship->isSunk()) return false; return true; }
`,
  'Game.h': `// ============================================================
// Game — Main game controller with pirate theme
// ============================================================
#pragma once
#include "Player.h"
#include <string>

enum class GamePhase { MENU, SETUP, BATTLE, GAME_OVER };
enum class Difficulty { EASY, HARD };

class Game {
public:
    void run();
    
private:
    Player player;
    Player enemy;
    GamePhase phase = GamePhase::MENU;
    Difficulty difficulty = Difficulty::HARD;
    bool playerTurn = true;
    
    // Screens
    void showMenu();
    void showSetup();
    void showBattle();
    void showGameOver();
    
    // Setup
    void chooseDifficulty();
    void placePlayerShips();
    void autoPlacePlayerShips();
    void autoPlaceEnemyShips();
    
    // Battle
    void playerShoot();
    void enemyShoot();
    void displayBothBoards() const;
    
    // Pirate phrases
    std::string getRandomHitPhrase() const;
    std::string getRandomMissPhrase() const;
    std::string getRandomSunkPhrase() const;
    std::string getRandomVictoryPhrase() const;
    std::string getRandomDefeatPhrase() const;
    
    // Utilities
    void clearScreen() const;
    void printTitle() const;
    void printSeparator() const;
    std::string coordToString(int x, int y) const;
};
`,
  'Game.cpp': `// ============================================================
// Game Implementation — Pirate Sea Battle
// ============================================================
#include "Game.h"
#include <iostream>
#include <iomanip>
#include <thread>
#include <chrono>

// ... (full game implementation)

void Game::run() {
    showMenu();
    chooseDifficulty();
    showSetup();
    autoPlaceEnemyShips();
    phase = GamePhase::BATTLE;
    showBattle();
}

void Game::showMenu() {
    clearScreen();
    printTitle();
    std::cout << "\\n  ⚓ Добро пожаловать в Морской Бой! ⚓\\n";
    printSeparator();
}

void Game::chooseDifficulty() {
    std::cout << "\\nВыберите сложность:\\n";
    std::cout << "  1. Лёгкий (бот стреляет наугад)\\n";
    std::cout << "  2. Сложный (умный бот с добиванием)\\n";
    // ...
}

void Game::autoPlaceEnemyShips() { enemy.board.autoPlaceAllShips(); }

void Game::showBattle() {
    while (phase == GamePhase::BATTLE) {
        displayBothBoards();
        if (playerTurn) playerShoot(); else enemyShoot();
        if (player.hasLost() || enemy.hasLost()) phase = GamePhase::GAME_OVER;
    }
    showGameOver();
}

void Game::playerShoot() {
    int x, y;
    std::cout << "Ваш ход! Введите координаты (например: А 5): ";
    // ... shooting logic with hit/miss/sunk detection
}

std::string Game::coordToString(int x, int y) const {
    const char labels[] = {'А','Б','В','Г','Д','Е','Ж','З','И','К'};
    return std::string(1, labels[x]) + std::to_string(y + 1);
}

void Game::clearScreen() const {
    #ifdef _WIN32
        system("cls");
    #else
        system("clear");
    #endif
}

void Game::printTitle() const {
    std::cout << R"(
   ██████╗  █████╗ ████████╗████████╗██╗     ███████╗
   ██╔══██╗██╔══██╗╚══██╔══╝╚══██╔══╝██║     ██╔════╝
   ██████╔╝███████║   ██║      ██║   ██║     █████╗  
   ██╔══██╗██╔══██║   ██║      ██║   ██║     ██╔══╝  
   ██████╔╝██║  ██║   ██║      ██║   ███████╗███████╗
   ╚═════╝ ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚══════╝
)" << '\n';
}
`,
  'utils.h': `// ============================================================
// Utils — Helper functions and terminal utilities
// ============================================================
#pragma once
#include <string>

namespace Utils {
    void clearScreen();
    void setColor(int color);
    void resetColor();
    void sleep(int milliseconds);
    void playSound(const std::string& sound);
    std::string getInput();
    bool isValidCoord(const std::string& input, int& x, int& y);
}
`,
  'utils.cpp': `// ============================================================
// Utils Implementation
// ============================================================
#include "utils.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <cctype>

#ifdef _WIN32
    #include <windows.h>
    #include <conio.h>
#else
    #include <termios.h>
    #include <unistd.h>
#endif

namespace Utils {
    void clearScreen() {
        #ifdef _WIN32
            system("cls");
        #else
            system("clear");
        #endif
    }
    
    void setColor(int color) {
        #ifdef _WIN32
            SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), color);
        #else
            // ANSI escape codes for Unix
            std::cout << "\\033[" << color << "m";
        #endif
    }
    
    void resetColor() {
        #ifdef _WIN32
            SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);
        #else
            std::cout << "\\033[0m";
        #endif
    }
    
    void sleep(int ms) { std::this_thread::sleep_for(std::chrono::milliseconds(ms)); }
    
    void playSound(const std::string& /*sound*/) {
        // Sound effects would go here
    }
    
    std::string getInput() {
        std::string input;
        std::getline(std::cin, input);
        return input;
    }
    
    bool isValidCoord(const std::string& input, int& x, int& y) {
        if (input.length() < 2) return false;
        char col = std::toupper(input[0]);
        if (col < 'А' || col > 'К' || col == 'Й') return false;
        x = (col >= 'А' && col < 'Й') ? (col - 'А') : (col == 'К' ? 9 : -1);
        try { y = std::stoi(input.substr(1)) - 1; } catch (...) { return false; }
        return x >= 0 && x < 10 && y >= 0 && y < 10;
    }
}
`,
  'README.md': `# Sea Battle (Morskaya Bitva)

A pirate-themed console battleship game written in C++.

## Building

### Using Make
\`\`\`bash
make
./sea_battle
\`\`\`

### Using CMake
\`\`\`bash
mkdir build && cd build
cmake ..
make
./sea_battle
\`\`\`

## Controls

- **Arrow Keys / WASD** — Move cursor
- **Space** — Rotate ship
- **Enter** — Place ship / Fire
- **R** — Auto-place ships

## Fleet

| Ship | Size | Count |
|------|------|-------|
| Линкор | 4 | 1 |
| Крейсер | 3 | 2 |
| Эсминец | 2 | 3 |
| Торпедный катер | 1 | 4 |

## License

MIT
`,
  'Makefile': `# Sea Battle Makefile
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
SRC = src/main.cpp src/Board.cpp src/Ship.cpp src/Player.cpp src/Game.cpp src/utils.cpp
OBJ = $(SRC:.cpp=.o)
TARGET = sea_battle

.PHONY: all clean run

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(OBJ) $(TARGET)
`,
};
`, 