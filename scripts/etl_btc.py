"""
ETL BTC Oracle - Script de prédiction Bitcoin
==============================================

Ce script:
1. Récupère les données historiques BTC-USD via yfinance
2. Prépare les features pour le ML
3. Entraîne une régression linéaire sur les 30 derniers jours
4. Prédit le prix de J+1
5. Envoie les données à Supabase

Usage:
    python etl_btc.py

Prérequis:
    pip install yfinance pandas scikit-learn supabase python-dotenv

Variables d'environnement (.env):
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_KEY=eyJ...
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

# ============================================
# CONFIGURATION
# ============================================

SYMBOL = "BTC-USD"
LOOKBACK_DAYS = 60  # Jours d'historique à récupérer
TRAINING_WINDOW = 30  # Jours utilisés pour l'entraînement
MODEL_VERSION = "linear_v1"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Utiliser la service_role key!


def get_supabase_client() -> Optional[Client]:
    """Initialise le client Supabase avec validation."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERREUR: Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises")
        print("Créez un fichier .env avec ces variables")
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_btc_data(days: int = LOOKBACK_DAYS) -> pd.DataFrame:
    """
    Récupère les données historiques BTC-USD via yfinance.

    Returns:
        DataFrame avec colonnes: Date, Open, High, Low, Close, Volume
    """
    print(f"Récupération des {days} derniers jours de données {SYMBOL}...")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    ticker = yf.Ticker(SYMBOL)
    df = ticker.history(start=start_date, end=end_date)

    if df.empty:
        raise ValueError(f"Aucune donnée récupérée pour {SYMBOL}")

    # Nettoyer et formater
    df = df.reset_index()
    df['Date'] = pd.to_datetime(df['Date']).dt.date
    df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]

    # Supprimer les doublons et valeurs manquantes
    df = df.drop_duplicates(subset=['Date'])
    df = df.dropna()

    print(f"  {len(df)} jours de données récupérés")
    print(f"  Période: {df['Date'].min()} -> {df['Date'].max()}")

    return df


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prépare les features pour le modèle ML.

    Features créées:
    - day_of_week: Jour de la semaine (0-6)
    - day_index: Index numérique du jour (pour la tendance)
    - prev_close: Prix de clôture J-1
    - price_change: Variation en %
    - volatility: (High - Low) / Close
    - ma_7: Moyenne mobile 7 jours
    """
    df = df.copy()

    # Features temporelles
    df['day_of_week'] = pd.to_datetime(df['Date']).dt.dayofweek
    df['day_index'] = range(len(df))

    # Features de prix
    df['prev_close'] = df['Close'].shift(1)
    df['price_change'] = df['Close'].pct_change() * 100
    df['volatility'] = (df['High'] - df['Low']) / df['Close']

    # Moyennes mobiles
    df['ma_7'] = df['Close'].rolling(window=7).mean()

    # Supprimer les lignes avec NaN (dues aux calculs de lag)
    df = df.dropna()

    return df


def train_model(df: pd.DataFrame) -> tuple:
    """
    Entraîne une régression linéaire sur les données.

    Pour cette v1 simple, on utilise uniquement day_index comme feature
    (tendance linéaire). Cela permet de prédire la "continuation de tendance".

    Returns:
        (model, metrics_dict, prediction, confidence, lower_bound, upper_bound)
    """
    print(f"\nEntraînement sur les {TRAINING_WINDOW} derniers jours...")

    # Utiliser les N derniers jours
    train_df = df.tail(TRAINING_WINDOW).copy()

    # Feature simple: index du jour (capture la tendance)
    # On réindexe pour que le modèle apprenne la tendance récente
    train_df['train_index'] = range(len(train_df))

    X = train_df[['train_index']].values
    y = train_df['Close'].values

    # Entraînement
    model = LinearRegression()
    model.fit(X, y)

    # Prédictions sur les données d'entraînement
    y_pred_train = model.predict(X)

    # Métriques
    mae = mean_absolute_error(y, y_pred_train)
    rmse = np.sqrt(mean_squared_error(y, y_pred_train))
    r2 = r2_score(y, y_pred_train)

    # Prédiction pour J+1
    next_index = np.array([[TRAINING_WINDOW]])
    prediction = model.predict(next_index)[0]

    # Calcul du score de confiance basé sur R²
    confidence = max(0, min(1, r2))  # Clamp entre 0 et 1

    # Calcul de l'intervalle de confiance 95%
    # Basé sur l'écart-type des résidus
    residuals = y - y_pred_train
    std_error = np.std(residuals)
    # Intervalle 95% : ±1.96 * écart-type
    lower_bound = prediction - 1.96 * std_error
    upper_bound = prediction + 1.96 * std_error

    metrics = {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'r2': round(r2, 4),
        'coefficient': round(model.coef_[0], 4),
        'intercept': round(model.intercept_, 2),
        'std_error': round(std_error, 2)
    }

    print(f"  Coefficient (pente): {metrics['coefficient']} $/jour")
    print(f"  MAE: ${metrics['mae']}")
    print(f"  RMSE: ${metrics['rmse']}")
    print(f"  R²: {metrics['r2']}")
    print(f"  Prédiction J+1: ${prediction:,.2f}")
    print(f"  Intervalle 95%: [${lower_bound:,.2f} - ${upper_bound:,.2f}]")
    print(f"  Confiance: {confidence:.2%}")

    return model, metrics, prediction, confidence, lower_bound, upper_bound


def upload_to_supabase(
    client: Client,
    df: pd.DataFrame,
    prediction: float,
    confidence: float,
    lower_bound: float,
    upper_bound: float
) -> bool:
    """
    Upload les données historiques et la prédiction vers Supabase.

    Utilise upsert pour éviter les doublons (basé sur date+symbol+model_version).
    """
    print("\nUpload vers Supabase...")

    # Préparer les données historiques
    historical_records = []
    for _, row in df.iterrows():
        historical_records.append({
            'date': str(row['Date']),
            'symbol': SYMBOL,
            'actual_price': float(row['Close']),
            'predicted_price': None,  # Pas de prédiction pour l'historique
            'model_version': MODEL_VERSION,
            'confidence_score': None,
            'prediction_lower_bound': None,
            'prediction_upper_bound': None
        })

    # Ajouter la prédiction pour demain
    tomorrow = datetime.now().date() + timedelta(days=1)
    prediction_record = {
        'date': str(tomorrow),
        'symbol': SYMBOL,
        'actual_price': None,  # Pas encore connu
        'predicted_price': round(prediction, 2),
        'model_version': MODEL_VERSION,
        'confidence_score': round(confidence, 4),
        'prediction_lower_bound': round(lower_bound, 2),
        'prediction_upper_bound': round(upper_bound, 2)
    }

    try:
        # Upsert des données historiques (par lots de 100)
        batch_size = 100
        for i in range(0, len(historical_records), batch_size):
            batch = historical_records[i:i + batch_size]
            client.table('crypto_metrics').upsert(
                batch,
                on_conflict='date,symbol,model_version'
            ).execute()

        print(f"  {len(historical_records)} enregistrements historiques uploadés")

        # Upsert de la prédiction
        client.table('crypto_metrics').upsert(
            prediction_record,
            on_conflict='date,symbol,model_version'
        ).execute()

        print(f"  Prédiction pour {tomorrow} uploadée")

        return True

    except Exception as e:
        print(f"ERREUR Supabase: {e}")
        return False


def main():
    """Point d'entrée principal du script ETL."""
    print("=" * 50)
    print("BTC Oracle - ETL Pipeline")
    print(f"Date d'exécution: {datetime.now()}")
    print("=" * 50)

    # 1. Connexion Supabase
    client = get_supabase_client()
    if not client:
        sys.exit(1)

    # 2. Récupération des données
    try:
        df = fetch_btc_data()
    except Exception as e:
        print(f"ERREUR lors de la récupération: {e}")
        sys.exit(1)

    # 3. Préparation des features
    df = prepare_features(df)

    # 4. Entraînement et prédiction
    model, metrics, prediction, confidence, lower_bound, upper_bound = train_model(df)

    # 5. Upload vers Supabase
    success = upload_to_supabase(client, df, prediction, confidence, lower_bound, upper_bound)

    if success:
        print("\n" + "=" * 50)
        print("Pipeline terminé avec succès!")
        print(f"Prochaine prédiction: ${prediction:,.2f} pour demain")
        print("=" * 50)
    else:
        print("\nPipeline terminé avec des erreurs")
        sys.exit(1)


if __name__ == "__main__":
    main()
