// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title Reservable
 */

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

abstract contract ERC20Reservable is ERC20 {
    enum ReservationStatus {
        Draft, // 0
        Active, // 1
        Reclaimed, // 2
        Completed // 3
    }

    struct Reservation {
        uint256 amount;
        uint256 fee;
        address recipient;
        address executor;
        uint256 expiryBlockNum;
        ReservationStatus status;
    }

    // Events
    event Reserved(
        address indexed from,
        address indexed to,
        address indexed executor,
        uint256 amount,
        uint256 fee,
        uint256 nonce,
        uint256 deadline
    );

    event Executed(
        address indexed from,
        address indexed executor,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        uint256 nonce
    );
    event Reclaimed(address indexed from, address indexed executor, uint256 amount, uint256 fee, uint256 nonce);

    // Total balance of all active reservations per address
    mapping(address => uint256) private _totalReserved;

    // Mapping of all reservations per address and nonces
    mapping(address => mapping(uint256 => Reservation)) internal _reservation;

    function _reserve(
        address from_,
        address to_,
        address executor_,
        uint256 amount_,
        uint256 executionFee_,
        uint256 nonce_,
        uint256 deadline_
    ) internal {
        require(deadline_ > block.number, 'ERC20Reservable: deadline must be in the future');
        require(balanceOf(from_) >= amount_ + executionFee_, 'ERC20Reservable: reserve amount exceeds balance');
        _reservation[from_][nonce_] = Reservation(
            amount_,
            executionFee_,
            to_,
            executor_,
            deadline_,
            ReservationStatus.Active
        );
        _totalReserved[from_] += amount_ + executionFee_;
        emit Reserved(from_, to_, executor_, amount_, executionFee_, nonce_, deadline_);
    }

    function reserveOf(address account_) external view returns (uint256 count) {
        return _totalReserved[account_];
    }

    function getReservation(address account_, uint256 nonce_) external view returns (Reservation memory) {
        return _reservation[account_][nonce_];
    }

    function _execute(address from_, Reservation storage reservation) internal {
        require(reservation.expiryBlockNum != 0, 'ERC20Reservable: reservation does not exist');
        require(
            reservation.executor == _msgSender() || from_ == _msgSender(),
            'ERC20Reservable: this address is not authorized to execute this reservation'
        );
        require(
            reservation.expiryBlockNum > block.number,
            'ERC20Reservable: reservation has expired and cannot be executed'
        );
        require(
            reservation.status == ReservationStatus.Active,
            'ERC20Reservable: invalid reservation status to execute'
        );

        uint256 fee = reservation.fee;
        uint256 amount = reservation.amount;
        address recipient = reservation.recipient;
        address executor = reservation.executor;

        reservation.status = ReservationStatus.Completed;
        unchecked {
            _totalReserved[from_] -= amount + fee;
        }

        _transfer(from_, executor, fee);
        _transfer(from_, recipient, amount);

        emit Executed(from_, executor, recipient, amount, fee, reservation.expiryBlockNum);
    }

    function execute(address from_, uint256 nonce_) external returns (bool success) {
        Reservation storage reservation = _reservation[from_][nonce_];
        _execute(from_, reservation);
        return true;
    }

    function reclaim(address from_, uint256 nonce_) external returns (bool success) {
        Reservation storage reservation = _reservation[from_][nonce_];
        address executor = reservation.executor;

        require(reservation.expiryBlockNum != 0, 'ERC20Reservable: reservation does not exist');
        require(
            reservation.status == ReservationStatus.Active,
            'ERC20Reservable: invalid reservation status to reclaim'
        );
        if (_msgSender() != executor) {
            require(
                _msgSender() == from_,
                'ERC20Reservable: only the sender or the executor can reclaim the reservation back to the sender'
            );
            require(
                reservation.expiryBlockNum <= block.number,
                'ERC20Reservable: reservation has not expired to be reclaimed by non-executor'
            );
        }

        reservation.status = ReservationStatus.Reclaimed;
        unchecked {
            _totalReserved[from_] -= reservation.amount + reservation.fee;
        }

        emit Reclaimed(from_, executor, reservation.amount, reservation.fee, nonce_);
        return true;
    }

    function balanceOf(address account) public view virtual override returns (uint256 amount) {
        return ERC20.balanceOf(account) - _totalReserved[account];
    }
}
