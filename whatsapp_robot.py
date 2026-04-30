import time
import requests
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import subprocess

app = Flask(__name__)
CORS(app)

# Configuración de Selenium
print("🚀 Iniciando el Robot de WhatsApp...")
chrome_options = Options()
# chrome_options.add_argument("--user-data-dir=./wa_session") # Descomenta para guardar sesión

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
driver.get("https://web.whatsapp.com")

print("✅ Robot listo. Por favor, escanea el código QR en la ventana de Chrome que se abrió.")

def send_to_whatsapp(phone, message, image_url=None):
    try:
        # Limpiar número
        phone = "".join(filter(str.isdigit, phone))
        
        # Ir directamente al chat
        print(f"📧 Enviando a: {phone}...")
        driver.get(f"https://web.whatsapp.com/send?phone={phone}&text={message}")
        
        # Esperar a que el chat cargue (el cuadro de texto debe aparecer)
        wait = WebDriverWait(driver, 35)
        text_box_xpath = '//div[@contenteditable="true"][@data-tab="10"]'
        wait.until(EC.presence_of_element_located((By.XPATH, text_box_xpath)))
        
        time.sleep(2) # Respiro para estabilidad

        if image_url:
            print(f"🖼️ Adjuntando imagen: {image_url}")
            # Descargar imagen temporal
            img_data = requests.get(image_url).content
            temp_path = os.path.abspath("temp_wa_img.png")
            with open(temp_path, 'wb') as f:
                f.write(img_data)
            
            # Clic en el botón de adjuntar (clip / plus)
            attach_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[@title="Adjuntar"] | //div[@title="Attach"] | //span[@data-icon="plus"] | //span[@data-icon="attach-menu-plus"]')))
            attach_btn.click()
            time.sleep(1.5)
            
            # El input de tipo file para imágenes (oculto)
            image_input = driver.find_element(By.XPATH, '//input[@accept="image/*,video/mp4,video/3gpp,video/quicktime"]')
            image_input.send_keys(temp_path)
            
            # Esperar a que cargue la previsualización y dar Enter
            time.sleep(2)
            send_btn = wait.until(EC.presence_of_element_located((By.XPATH, '//span[@data-icon="send"]')))
            send_btn.click()
            print("✅ Imagen y texto enviados.")
        else:
            # Solo texto
            input_box = driver.find_element(By.XPATH, text_box_xpath)
            input_box.send_keys(Keys.ENTER)
            print("✅ Texto enviado.")
            
        return True
    except Exception as e:
        print(f"❌ Error al enviar: {e}")
        return False

@app.route('/send', methods=['POST'])
def api_send():
    data = request.json
    phone = data.get('phone')
    text = data.get('text')
    image = data.get('image')
    
    if not phone or not text:
        return jsonify({"success": False, "error": "Faltan datos"}), 400
        
    success = send_to_whatsapp(phone, text, image)
    return jsonify({"success": success})

if __name__ == '__main__':
    # Ejecutar servidor en puerto 5000
    app.run(port=5000, debug=False, use_reloader=False)
