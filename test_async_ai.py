import asyncio
import time
from api.proses_ai import predict_model_rf, predict_model_svm


async def test_async_ai():
    print("=" * 60)
    print("PENGUJIAN KONKURENSI ASYNCHRONOUS (asyncio.gather)")
    print("=" * 60)

    sample_input = "Deteksi aktivitas mencurigakan dan bahaya siber"
    print(f"Input Teks      : '{sample_input}'")
    print("Model A (RF)    : Estimasi delay 0.3 detik")
    print("Model B (SVM)   : Estimasi delay 0.5 detik")
    print("-" * 60)

    # 1. Eksekusi Asynchronous / Paralel
    start_async = time.time()
    res_rf, res_svm = await asyncio.gather(
        predict_model_rf(sample_input),
        predict_model_svm(sample_input)
    )
    end_async = time.time()
    async_duration = round(end_async - start_async, 4)

    print(f"Hasil Model RF  : {res_rf}")
    print(f"Hasil Model SVM : {res_svm}")
    print(f"Total Waktu Asynchronous : {async_duration} detik")
    print("-" * 60)

    # 2. Perbandingan dengan Sekuensial
    start_seq = time.time()
    await predict_model_rf(sample_input)
    await predict_model_svm(sample_input)
    end_seq = time.time()
    seq_duration = round(end_seq - start_seq, 4)
    print(f"Perbandingan Sekuensial   : {seq_duration} detik (0.3s + 0.5s = ~0.8s)")

    print("=" * 60)
    print("KESIMPULAN PENGUJIAN:")
    if async_duration < 0.65:
        print(f"[BERHASIL] Waktu asinkron ({async_duration}s) mendekati model terlama (~0.5s),")
        print("           BUKAN penjumlahan keduanya (~0.8s).")
    else:
        print("[GAGAL] Eksekusi tidak berjalan secara paralel.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_async_ai())
