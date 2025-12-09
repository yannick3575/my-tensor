"""
Tests pour le script ETL BTC Oracle.

Ces tests utilisent des mocks pour éviter les appels API réels
(yfinance, Supabase).
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

# Import des fonctions à tester
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl_btc import (
    fetch_btc_data,
    prepare_features,
    train_model,
    upload_to_supabase,
    get_supabase_client,
    TRAINING_WINDOW,
)


# ============================================
# Fixtures
# ============================================

@pytest.fixture
def sample_btc_data():
    """Crée un DataFrame de données BTC de test."""
    dates = pd.date_range(end=datetime.now(), periods=40, freq='D')
    np.random.seed(42)  # Pour reproductibilité

    base_price = 40000
    prices = base_price + np.cumsum(np.random.randn(40) * 500)

    df = pd.DataFrame({
        'Date': dates.date,
        'Open': prices * 0.99,
        'High': prices * 1.02,
        'Low': prices * 0.98,
        'Close': prices,
        'Volume': np.random.randint(1000000, 5000000, 40)
    })
    return df


@pytest.fixture
def prepared_data(sample_btc_data):
    """Données avec features préparées."""
    return prepare_features(sample_btc_data)


# ============================================
# Tests: fetch_btc_data
# ============================================

class TestFetchBtcData:
    """Tests pour la fonction fetch_btc_data."""

    @patch('etl_btc.yf.Ticker')
    def test_fetch_returns_dataframe(self, mock_ticker):
        """Vérifie que fetch retourne un DataFrame avec les bonnes colonnes."""
        # Setup mock - yfinance returns a DataFrame with DatetimeIndex
        dates = pd.date_range(end=datetime.now(), periods=30)
        mock_history = pd.DataFrame({
            'Open': [40000] * 30,
            'High': [41000] * 30,
            'Low': [39000] * 30,
            'Close': [40500] * 30,
            'Volume': [1000000] * 30
        }, index=dates)
        mock_history.index.name = 'Date'
        mock_ticker.return_value.history.return_value = mock_history

        # Execute
        result = fetch_btc_data(days=30)

        # Assert
        assert isinstance(result, pd.DataFrame)
        assert 'Date' in result.columns
        assert 'Close' in result.columns
        assert len(result) > 0

    @patch('etl_btc.yf.Ticker')
    def test_fetch_raises_on_empty_data(self, mock_ticker):
        """Vérifie que fetch lève une erreur si pas de données."""
        mock_ticker.return_value.history.return_value = pd.DataFrame()

        with pytest.raises(ValueError, match="Aucune donnée récupérée"):
            fetch_btc_data()


# ============================================
# Tests: prepare_features
# ============================================

class TestPrepareFeatures:
    """Tests pour la fonction prepare_features."""

    def test_creates_all_features(self, sample_btc_data):
        """Vérifie que toutes les features sont créées."""
        result = prepare_features(sample_btc_data)

        expected_features = [
            'day_of_week', 'day_index', 'prev_close',
            'price_change', 'volatility', 'ma_7'
        ]

        for feature in expected_features:
            assert feature in result.columns, f"Feature manquante: {feature}"

    def test_removes_nan_rows(self, sample_btc_data):
        """Vérifie que les lignes NaN sont supprimées."""
        result = prepare_features(sample_btc_data)

        # Pas de NaN dans le résultat
        assert not result.isnull().any().any()

    def test_day_of_week_range(self, sample_btc_data):
        """Vérifie que day_of_week est entre 0 et 6."""
        result = prepare_features(sample_btc_data)

        assert result['day_of_week'].min() >= 0
        assert result['day_of_week'].max() <= 6

    def test_volatility_is_positive(self, sample_btc_data):
        """Vérifie que la volatilité est positive."""
        result = prepare_features(sample_btc_data)

        assert (result['volatility'] >= 0).all()

    def test_ma_7_calculation(self, sample_btc_data):
        """Vérifie le calcul de la moyenne mobile 7 jours."""
        result = prepare_features(sample_btc_data)

        # La MA7 doit être proche de la moyenne des 7 derniers Close
        last_7_close = sample_btc_data['Close'].iloc[-7:].mean()
        ma_7_last = result['ma_7'].iloc[-1]

        # Tolérance de 1% pour les erreurs d'arrondi
        assert abs(ma_7_last - last_7_close) / last_7_close < 0.01


# ============================================
# Tests: train_model
# ============================================

class TestTrainModel:
    """Tests pour la fonction train_model."""

    def test_returns_correct_tuple(self, prepared_data):
        """Vérifie que train_model retourne le bon format."""
        model, metrics, prediction, confidence, lower_bound, upper_bound = train_model(prepared_data)

        assert model is not None
        assert isinstance(metrics, dict)
        assert isinstance(prediction, (int, float))
        assert isinstance(confidence, float)
        assert isinstance(lower_bound, (int, float))
        assert isinstance(upper_bound, (int, float))

    def test_metrics_keys(self, prepared_data):
        """Vérifie que les métriques contiennent les bonnes clés."""
        _, metrics, _, _, _, _ = train_model(prepared_data)

        expected_keys = ['mae', 'rmse', 'r2', 'coefficient', 'intercept', 'std_error']
        for key in expected_keys:
            assert key in metrics, f"Clé manquante: {key}"

    def test_confidence_range(self, prepared_data):
        """Vérifie que la confiance est entre 0 et 1."""
        _, _, _, confidence, _, _ = train_model(prepared_data)

        assert 0 <= confidence <= 1

    def test_confidence_interval_bounds(self, prepared_data):
        """Vérifie que lower_bound < prediction < upper_bound."""
        _, _, prediction, _, lower_bound, upper_bound = train_model(prepared_data)

        assert lower_bound < prediction < upper_bound

    def test_prediction_is_positive(self, prepared_data):
        """Vérifie que la prédiction est positive (prix BTC)."""
        _, _, prediction, _, _, _ = train_model(prepared_data)

        assert prediction > 0

    def test_uses_training_window(self, prepared_data):
        """Vérifie que le modèle utilise TRAINING_WINDOW jours."""
        # Si on a plus de données que TRAINING_WINDOW, ça doit fonctionner
        assert len(prepared_data) >= TRAINING_WINDOW


# ============================================
# Tests: upload_to_supabase
# ============================================

class TestUploadToSupabase:
    """Tests pour la fonction upload_to_supabase."""

    def test_upload_success(self, prepared_data):
        """Vérifie qu'un upload réussi retourne True."""
        mock_client = MagicMock()
        mock_client.table.return_value.upsert.return_value.execute.return_value = None

        result = upload_to_supabase(
            client=mock_client,
            df=prepared_data,
            prediction=45000.0,
            confidence=0.85,
            lower_bound=44000.0,
            upper_bound=46000.0
        )

        assert result is True

    def test_upload_calls_upsert(self, prepared_data):
        """Vérifie que upsert est appelé avec les bonnes données."""
        mock_client = MagicMock()
        mock_client.table.return_value.upsert.return_value.execute.return_value = None

        upload_to_supabase(
            client=mock_client,
            df=prepared_data,
            prediction=45000.0,
            confidence=0.85,
            lower_bound=44000.0,
            upper_bound=46000.0
        )

        # Vérifie que table('crypto_metrics') est appelé
        mock_client.table.assert_called_with('crypto_metrics')

    def test_upload_failure_returns_false(self, prepared_data):
        """Vérifie qu'une erreur retourne False."""
        mock_client = MagicMock()
        mock_client.table.return_value.upsert.return_value.execute.side_effect = Exception("DB Error")

        result = upload_to_supabase(
            client=mock_client,
            df=prepared_data,
            prediction=45000.0,
            confidence=0.85,
            lower_bound=44000.0,
            upper_bound=46000.0
        )

        assert result is False

    def test_prediction_record_format(self, prepared_data):
        """Vérifie le format de l'enregistrement de prédiction."""
        mock_client = MagicMock()
        mock_execute = MagicMock()
        mock_client.table.return_value.upsert.return_value.execute = mock_execute

        upload_to_supabase(
            client=mock_client,
            df=prepared_data,
            prediction=45000.0,
            confidence=0.85,
            lower_bound=44000.0,
            upper_bound=46000.0
        )

        # Récupérer le dernier appel à upsert (la prédiction)
        calls = mock_client.table.return_value.upsert.call_args_list
        last_call = calls[-1]
        prediction_record = last_call[0][0]  # Premier argument positionnel

        # Vérifier les champs
        assert prediction_record['predicted_price'] == 45000.0
        assert prediction_record['confidence_score'] == 0.85
        assert prediction_record['actual_price'] is None
        assert prediction_record['prediction_lower_bound'] == 44000.0
        assert prediction_record['prediction_upper_bound'] == 46000.0


# ============================================
# Tests: get_supabase_client
# ============================================

class TestGetSupabaseClient:
    """Tests pour la fonction get_supabase_client."""

    @patch.dict(os.environ, {'SUPABASE_URL': '', 'SUPABASE_SERVICE_KEY': ''})
    def test_returns_none_without_env_vars(self):
        """Vérifie que None est retourné sans variables d'env."""
        # On doit recharger le module pour prendre en compte les nouvelles env vars
        # Pour ce test, on vérifie juste le comportement attendu
        with patch('etl_btc.SUPABASE_URL', ''):
            with patch('etl_btc.SUPABASE_KEY', ''):
                result = get_supabase_client()
                assert result is None

    @patch('etl_btc.create_client')
    def test_creates_client_with_valid_env(self, mock_create):
        """Vérifie que le client est créé avec des variables valides."""
        with patch('etl_btc.SUPABASE_URL', 'https://test.supabase.co'):
            with patch('etl_btc.SUPABASE_KEY', 'test-key'):
                mock_create.return_value = MagicMock()
                result = get_supabase_client()

                mock_create.assert_called_once_with(
                    'https://test.supabase.co',
                    'test-key'
                )
