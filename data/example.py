from lightning import Lightning
from numpy import random, ceil, array

lgn = Lightning()

series = random.randn(5,50)

lgn.line(series)