"""
AllRatesToday Exchange Rates API - Python Example
https://allratestoday.com
"""

import requests
from typing import Optional
from datetime import datetime

API_KEY = 'your_api_key_here'
BASE_URL = 'https://allratestoday.com/api/v1'


def get_exchange_rate(source: str, target: str) -> dict:
    """Get exchange rate between two currencies."""
    response = requests.get(
        f'{BASE_URL}/rates',
        params={'source': source, 'target': target},
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    response.raise_for_status()
    data = response.json()
    return data[0]


def get_all_rates(source: str) -> list:
    """Get all exchange rates for a base currency."""
    response = requests.get(
        f'{BASE_URL}/rates',
        params={'source': source},
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    response.raise_for_status()
    return response.json()


def get_historical_rate(source: str, target: str, date: str) -> dict:
    """Get historical exchange rate for a specific date."""
    response = requests.get(
        f'{BASE_URL}/rates',
        params={'source': source, 'target': target, 'time': date},
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    response.raise_for_status()
    data = response.json()
    return data[0]


def convert_currency(amount: float, source: str, target: str) -> dict:
    """Convert amount from one currency to another."""
    rate_data = get_exchange_rate(source, target)
    return {
        'amount': amount,
        'source': source,
        'target': target,
        'rate': rate_data['rate'],
        'result': amount * rate_data['rate'],
        'time': rate_data['time']
    }


if __name__ == '__main__':
    try:
        # Get USD to EUR rate
        rate = get_exchange_rate('USD', 'EUR')
        print(f"USD to EUR: {rate['rate']}")

        # Convert 100 USD to EUR
        conversion = convert_currency(100, 'USD', 'EUR')
        print(f"{conversion['amount']} {conversion['source']} = {conversion['result']:.2f} {conversion['target']}")

        # Get historical rate
        historical = get_historical_rate('USD', 'EUR', '2024-01-01T00:00:00Z')
        print(f"Historical USD to EUR (2024-01-01): {historical['rate']}")

    except requests.exceptions.HTTPError as e:
        print(f"API Error: {e.response.json().get('error', str(e))}")
    except Exception as e:
        print(f"Error: {e}")
